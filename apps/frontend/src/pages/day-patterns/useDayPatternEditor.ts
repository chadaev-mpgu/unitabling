import { computed, ref } from 'vue';

import type { DayPattern, DayPatternItem } from '@/domain/day-pattern.ts';
import {
  dayPatternDraftEquals,
  dayPatternIssues,
  dayPatternStats,
  formatDayPatternStats,
  nextDayPatternItem,
  normalizeDayPatternItems,
  reindexDayPatternItems,
  toDayPatternDraft,
  type DayPatternDraft,
} from '@/domain/day-pattern-view.ts';
import { useDayPatternStore } from '@/stores/global/day-pattern.ts';

/** Ключ строки списка для несохранённого черновика. */
const DRAFT_KEY = 'draft';

/** Строка списка шаблонов: сохранённый шаблон или несохранённый черновик. */
export interface DayPatternListItem {
  key: string;
  title: string;
  subtitle: string;
}

/** Подтверждение в диалоге; `blocked` — действие выполнить нельзя. */
export interface DayPatternConfirm {
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
 * Состояние экрана «Разметка шаблона дня» (UC-1.1): список шаблонов,
 * черновик правки с сохранением/сбросом, валидация слотов и подтверждения.
 *
 * Правки копятся в черновике и попадают в хранилище только по «Сохранить»:
 * изменение шаблона влияет на все проекты, поэтому показываем предупреждение
 * и не пишем на каждый чих.
 */
export function useDayPatternEditor() {
  const store = useDayPatternStore();

  const selectedId = ref<string | null>(store.patterns[0]?.id ?? null);
  const selectedItemPosition = ref<number | null>(null);
  const settingsVisible = ref(true);
  const error = ref<string | null>(null);
  const confirm = ref<DayPatternConfirm | null>(null);

  function patternFor(id: string | null): DayPattern | undefined {
    if (id === null) return undefined;
    return store.patterns.find((pattern) => pattern.id === id);
  }

  function emptyDraft(): DayPatternDraft {
    return { id: null, name: 'Новый шаблон', items: [] };
  }

  function buildDraft(id: string | null): DayPatternDraft {
    const pattern = patternFor(id);
    return pattern ? toDayPatternDraft(pattern) : emptyDraft();
  }

  const draft = ref<DayPatternDraft>(buildDraft(selectedId.value));

  /** Открывает шаблон или черновик; сбрасывает выбор пары и ошибки. */
  function loadSelection(id: string | null, preset?: DayPatternDraft): void {
    selectedId.value = id;
    draft.value = preset ?? buildDraft(id);
    selectedItemPosition.value = null;
    error.value = null;
  }

  const currentPattern = computed(() => patternFor(selectedId.value));
  const isNew = computed(() => draft.value.id === null);
  const isPristineDraft = computed(
    () =>
      isNew.value && draft.value.items.length === 0 && draft.value.name.trim() === 'Новый шаблон',
  );

  const isDirty = computed(() => {
    const pattern = currentPattern.value;
    return pattern ? !dayPatternDraftEquals(draft.value, pattern) : true;
  });

  /** Есть что терять при переключении: «пустой» новый черновик пропускаем. */
  const hasUnsavedChanges = computed(() => isDirty.value && !isPristineDraft.value);

  const selectedKey = computed(() => (isNew.value ? DRAFT_KEY : (selectedId.value ?? DRAFT_KEY)));

  const issues = computed(() => dayPatternIssues(draft.value.items));

  const validationMessage = computed(() => {
    if (!draft.value.name.trim()) return 'Укажите название шаблона';
    return issues.value[0]?.message ?? null;
  });

  const canSave = computed(() => validationMessage.value === null);

  const draftStats = computed(() => formatDayPatternStats(dayPatternStats(draft.value.items)));

  const references = computed(() =>
    currentPattern.value ? store.patternReferences(currentPattern.value.id) : null,
  );

  const canDelete = computed(() => references.value !== null && references.value.total === 0);

  const listItems = computed<DayPatternListItem[]>(() => {
    const items: DayPatternListItem[] = store.patterns.map((pattern) => ({
      key: pattern.id,
      title: pattern.name,
      subtitle: formatDayPatternStats(dayPatternStats(pattern.items)),
    }));
    if (isNew.value) {
      items.unshift({
        key: DRAFT_KEY,
        title: draft.value.name.trim() || 'Новый шаблон',
        subtitle: draftStats.value,
      });
    }
    return items;
  });

  const selectedItem = computed<{ position: number; item: DayPatternItem } | null>(() => {
    const position = selectedItemPosition.value;
    if (position === null) return null;
    const item = draft.value.items[position];
    return item ? { position, item } : null;
  });

  const selectedItemIssue = computed(() => {
    const position = selectedItemPosition.value;
    if (position === null) return null;
    return issues.value.find((issue) => issue.itemIndex === position + 1)?.message ?? null;
  });

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
        items: source.items.map((item) => ({ ...item })),
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
      items: normalizeDayPatternItems(draft.value.items),
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
    const blocked = store.patternReferences(pattern.id).total > 0;
    confirm.value = {
      title: `Удалить шаблон «${pattern.name}»?`,
      description: blocked
        ? 'Шаблон используется в шаблонах недели. Сначала назначьте дням недели другой шаблон.'
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

  /* Пары шаблона */

  function addItem(): void {
    draft.value.items.push(nextDayPatternItem(draft.value.items));
    selectedItemPosition.value = draft.value.items.length - 1;
  }

  function selectItem(position: number): void {
    selectedItemPosition.value = position;
  }

  function updateItem(position: number, patch: Partial<DayPatternItem>): void {
    const item = draft.value.items[position];
    if (item) Object.assign(item, patch);
  }

  function removeItem(position: number): void {
    draft.value.items.splice(position, 1);
    draft.value.items = reindexDayPatternItems(draft.value.items);

    const current = selectedItemPosition.value;
    if (current === null) return;
    if (current === position) selectedItemPosition.value = null;
    else if (current > position) selectedItemPosition.value = current - 1;
  }

  function closeItem(): void {
    selectedItemPosition.value = null;
  }

  function toggleSettings(): void {
    settingsVisible.value = !settingsVisible.value;
  }

  function setName(value: string): void {
    draft.value.name = value;
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
    error,
    confirm,
    issues,
    selectedItem,
    selectedItemIssue,
    settingsVisible,
    select,
    create,
    duplicate,
    revert,
    save,
    askRemove,
    confirmAction,
    cancelConfirm,
    addItem,
    selectItem,
    updateItem,
    removeItem,
    closeItem,
    toggleSettings,
    setName,
  };
}

export type DayPatternEditorSession = ReturnType<typeof useDayPatternEditor>;
