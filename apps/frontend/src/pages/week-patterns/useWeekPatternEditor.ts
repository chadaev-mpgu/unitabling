import { computed, ref } from 'vue';

import { randomColor, type Color } from '@/domain/color.ts';
import { Weekday } from '@/domain/week.ts';
import { emptyWeekPatternDays, type WeekPattern } from '@/domain/week-pattern.ts';
import {
  formatWeekPatternStats,
  normalizeWeekPatternDays,
  toWeekPatternDraft,
  weekPatternDraftEquals,
  weekPatternIssues,
  weekPatternStats,
  type WeekPatternDraft,
} from '@/domain/week-pattern-view.ts';
import { useDayPatternStore } from '@/stores/global/day-pattern.ts';
import { useWeekPatternStore } from '@/stores/global/week-pattern.ts';

/** Ключ строки списка для несохранённого черновика. */
const DRAFT_KEY = 'draft';

/** Строка списка шаблонов недели: сохранённый шаблон или черновик. */
export interface WeekPatternListItem {
  key: string;
  title: string;
  subtitle: string;
  color: Color;
}

/** Пункт выбора шаблона дня; `id === null` — выходной. */
export interface DayPatternOptionItem {
  id: string | null;
  name: string;
}

/** Подтверждение в диалоге; `blocked` — действие выполнить нельзя. */
export interface WeekPatternConfirm {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  blocked: boolean;
  action: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Состояние экрана «Разметка шаблона недели» (UC-1.2): список шаблонов,
 * черновик правки с сохранением/сбросом, назначение шаблонов дня по дням
 * недели, валидация и подтверждения.
 *
 * Правки копятся в черновике и попадают в хранилище только по «Сохранить»:
 * разметка недели общая для всех проектов, поэтому показываем предупреждение
 * и не пишем на каждый чих.
 */
export function useWeekPatternEditor() {
  const store = useWeekPatternStore();
  const dayPatternStore = useDayPatternStore();

  const selectedId = ref<string | null>(store.patterns[0]?.id ?? null);
  const settingsVisible = ref(true);
  const error = ref<string | null>(null);
  const confirm = ref<WeekPatternConfirm | null>(null);

  function patternFor(id: string | null): WeekPattern | undefined {
    if (id === null) return undefined;
    return store.patterns.find((pattern) => pattern.id === id);
  }

  function emptyDraft(): WeekPatternDraft {
    return { id: null, name: 'Новый шаблон', color: randomColor(), days: emptyWeekPatternDays() };
  }

  function buildDraft(id: string | null): WeekPatternDraft {
    const pattern = patternFor(id);
    return pattern ? toWeekPatternDraft(pattern) : emptyDraft();
  }

  const draft = ref<WeekPatternDraft>(buildDraft(selectedId.value));

  /** Открывает шаблон или черновик; сбрасывает ошибки. */
  function loadSelection(id: string | null, preset?: WeekPatternDraft): void {
    selectedId.value = id;
    draft.value = preset ?? buildDraft(id);
    error.value = null;
  }

  const currentPattern = computed(() => patternFor(selectedId.value));
  const isNew = computed(() => draft.value.id === null);
  const isPristineDraft = computed(
    () =>
      isNew.value &&
      draft.value.name.trim() === 'Новый шаблон' &&
      draft.value.days.every((day) => day.templateId === null),
  );

  const isDirty = computed(() => {
    const pattern = currentPattern.value;
    return pattern ? !weekPatternDraftEquals(draft.value, pattern) : true;
  });

  /** Есть что терять при переключении: «пустой» новый черновик пропускаем. */
  const hasUnsavedChanges = computed(() => isDirty.value && !isPristineDraft.value);

  const selectedKey = computed(() => (isNew.value ? DRAFT_KEY : (selectedId.value ?? DRAFT_KEY)));

  const issues = computed(() => weekPatternIssues(draft.value.days));

  const validationMessage = computed(() => {
    if (!draft.value.name.trim()) return 'Укажите название шаблона';
    return issues.value[0]?.message ?? null;
  });

  const canSave = computed(() => validationMessage.value === null);

  /** Пункты выбора дня недели: «(Выходной)» и шаблоны дня справочника. */
  const dayPatternOptions = computed<DayPatternOptionItem[]>(() => [
    { id: null, name: '(Выходной)' },
    ...dayPatternStore.patterns.map((pattern) => ({ id: pattern.id, name: pattern.name })),
  ]);

  const references = computed(() =>
    currentPattern.value ? store.patternReferences(currentPattern.value.id) : null,
  );

  const canDelete = computed(() => references.value !== null && references.value.total === 0);

  const draftStats = computed(() =>
    formatWeekPatternStats(weekPatternStats(draft.value.days, references.value?.total ?? 0)),
  );

  const listItems = computed<WeekPatternListItem[]>(() =>
    store.patterns.map((pattern) => ({
      key: pattern.id,
      title: pattern.name,
      subtitle: formatWeekPatternStats(
        weekPatternStats(pattern.days, store.patternReferences(pattern.id).total),
      ),
      color: pattern.color,
    })),
  );

  /* Переключение и создание */

  function requestDiscard(action: () => void): void {
    confirm.value = {
      title: 'Несохранённые изменения',
      description: 'Изменения текущего шаблона не сохранены. Продолжить и потерять их?',
      confirmLabel: 'Продолжить',
      destructive: true,
      blocked: false,
      action,
    };
  }

  function select(key: string): void {
    if (key === selectedKey.value) return;
    const apply = () => loadSelection(key === DRAFT_KEY ? null : key);
    if (hasUnsavedChanges.value) requestDiscard(apply);
    else apply();
  }

  function create(): void {
    const apply = () => loadSelection(null);
    if (hasUnsavedChanges.value) requestDiscard(apply);
    else apply();
  }

  /** Дублирует текущий черновик в новый несохранённый шаблон. */
  function duplicate(): void {
    const source = draft.value;
    const apply = () =>
      loadSelection(null, {
        id: null,
        name: `${source.name.trim() || 'Шаблон'} (копия)`,
        color: source.color,
        days: source.days.map((day) => ({ ...day })),
      });
    if (hasUnsavedChanges.value) requestDiscard(apply);
    else apply();
  }

  /* Сохранение и удаление */

  function revert(): void {
    if (isNew.value) {
      loadSelection(store.patterns[0]?.id ?? null);
      return;
    }
    loadSelection(draft.value.id);
  }

  async function save(): Promise<void> {
    if (!canSave.value) {
      error.value = validationMessage.value;
      return;
    }
    error.value = null;

    const id = draft.value.id;
    const request = {
      name: draft.value.name.trim(),
      color: draft.value.color,
      days: normalizeWeekPatternDays(draft.value.days),
    };

    try {
      if (id === null) {
        const created = await store.addPattern(request);
        loadSelection(created.id);
      } else {
        await store.editPattern({ id, ...request });
        loadSelection(id);
      }
    } catch (caught) {
      error.value = errorMessage(caught, 'Не удалось сохранить шаблон');
    }
  }

  async function removePattern(id: string): Promise<void> {
    try {
      await store.removePattern(id);
      loadSelection(store.patterns[0]?.id ?? null);
    } catch (caught) {
      error.value = errorMessage(caught, 'Не удалось удалить шаблон');
    }
  }

  function askRemove(): void {
    const pattern = currentPattern.value;
    if (!pattern) return;
    const count = store.patternReferences(pattern.id).total;
    const blocked = count > 0;
    confirm.value = {
      title: `Удалить шаблон «${pattern.name}»?`,
      description: blocked
        ? 'Шаблон используется в академическом календаре. Сначала назначьте календарю другой шаблон недели.'
        : 'Шаблон будет удалён из справочника. Действие необратимо.',
      confirmLabel: 'Удалить',
      destructive: true,
      blocked,
      action: () => void removePattern(pattern.id),
    };
  }

  function confirmAction(): void {
    const pending = confirm.value;
    if (!pending || pending.blocked) return;
    confirm.value = null;
    pending.action();
  }

  function cancelConfirm(): void {
    confirm.value = null;
  }

  /* Дни недели и настройки */

  function setDayTemplate(weekday: Weekday, templateId: string | null): void {
    const day = draft.value.days.find((item) => item.weekday === weekday);
    if (day) day.templateId = templateId;
  }

  function setName(value: string): void {
    draft.value.name = value;
  }

  function setColor(value: Color): void {
    draft.value.color = value;
  }

  function toggleSettings(): void {
    settingsVisible.value = !settingsVisible.value;
  }

  return {
    listItems,
    selectedKey,
    draft,
    draftStats,
    isNew,
    isDirty,
    hasUnsavedChanges,
    canSave,
    canDelete,
    canDeleteHint: computed(() =>
      references.value && references.value.total > 0
        ? 'Шаблон используется в академическом календаре'
        : 'Удалить шаблон',
    ),
    dayPatternOptions,
    error,
    confirm,
    issues,
    settingsVisible,
    select,
    create,
    duplicate,
    revert,
    save,
    askRemove,
    confirmAction,
    cancelConfirm,
    setDayTemplate,
    setName,
    setColor,
    toggleSettings,
  };
}

export type WeekPatternEditorSession = ReturnType<typeof useWeekPatternEditor>;
