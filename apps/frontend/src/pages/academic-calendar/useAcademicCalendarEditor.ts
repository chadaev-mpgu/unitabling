import { computed, ref } from 'vue';

import {
  isValidISODate,
  parseISODate,
  toISODate,
  type AcademicCalendar,
} from '@/domain/academic-calendar.ts';
import {
  calendarDraftEquals,
  calendarIssues,
  calendarWeekViews,
  expandHolidayRange,
  formatCalendarStats,
  groupHolidayRanges,
  isDateInCalendar,
  normalizeCalendarDraft,
  toCalendarDraft,
  type CalendarDraft,
  type CalendarWeekView,
  type HolidayRange,
} from '@/domain/academic-calendar-view.ts';
import { startOfWeek } from '@/lib/date.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useWeekPatternStore } from '@/stores/global/week-pattern.ts';

/** Ключ строки списка для несохранённого черновика. */
const DRAFT_KEY = 'draft';

/** Шаблон нового календаря: учебный год по умолчанию — 16 недель. */
const DEFAULT_WEEKS = 16;

/** Строка списка календарей: сохранённый календарь или черновик. */
export interface AcademicCalendarListItem {
  key: string;
  title: string;
  subtitle: string;
}

/** Подтверждение в диалоге; `blocked` — действие выполнить нельзя. */
export interface AcademicCalendarConfirm {
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

/** Понедельник текущей недели — стартовая дата нового календаря. */
function defaultStartDate(): string {
  return toISODate(startOfWeek(new Date(), 1));
}

/**
 * Состояние экрана «Академический календарь» (UC-1.3, UC-1.4): список
 * календарей, черновик правки с сохранением/сбросом, недельная разметка
 * с заменами шаблона и праздниками, валидация и подтверждения.
 *
 * Правки копятся в черновике и попадают в хранилище только по «Сохранить»:
 * календарь общий для всех проектов, а праздник отменяет вхождения уроков
 * и возвращает часы в нагрузку (решение 12) — писать на каждый чих нельзя.
 */
export function useAcademicCalendarEditor() {
  const store = useAcademicCalendarStore();
  const weekPatternStore = useWeekPatternStore();

  const selectedId = ref<string | null>(store.calendars[0]?.id ?? null);
  const selectedWeekIndex = ref<number | null>(null);
  const settingsVisible = ref(true);
  const error = ref<string | null>(null);
  const holidayError = ref<string | null>(null);
  const confirm = ref<AcademicCalendarConfirm | null>(null);

  function defaultPatternId(): string {
    return weekPatternStore.patterns[0]?.id ?? '';
  }

  function calendarFor(id: string | null): AcademicCalendar | undefined {
    if (id === null) return undefined;
    return store.calendars.find((calendar) => calendar.id === id);
  }

  function emptyDraft(): CalendarDraft {
    return {
      id: null,
      name: 'Новый календарь',
      startDate: defaultStartDate(),
      weeks: DEFAULT_WEEKS,
      defaultPatternId: defaultPatternId(),
      overrides: [],
      holidays: [],
    };
  }

  function buildDraft(id: string | null): CalendarDraft {
    const calendar = calendarFor(id);
    return calendar ? toCalendarDraft(calendar) : emptyDraft();
  }

  const draft = ref<CalendarDraft>(buildDraft(selectedId.value));

  /** Открывает календарь или черновик; сбрасывает выбор недели и ошибки. */
  function loadSelection(id: string | null, preset?: CalendarDraft): void {
    selectedId.value = id;
    draft.value = preset ?? buildDraft(id);
    selectedWeekIndex.value = null;
    error.value = null;
    holidayError.value = null;
  }

  const currentCalendar = computed(() => calendarFor(selectedId.value));
  const isNew = computed(() => draft.value.id === null);
  const isPristineDraft = computed(
    () =>
      isNew.value &&
      draft.value.name.trim() === 'Новый календарь' &&
      draft.value.overrides.length === 0 &&
      draft.value.holidays.length === 0,
  );

  const isDirty = computed(() => {
    const calendar = currentCalendar.value;
    return calendar ? !calendarDraftEquals(draft.value, calendar) : true;
  });

  /** Есть что терять при переключении: «пустой» новый черновик пропускаем. */
  const hasUnsavedChanges = computed(() => isDirty.value && !isPristineDraft.value);

  const selectedKey = computed(() => (isNew.value ? DRAFT_KEY : (selectedId.value ?? DRAFT_KEY)));

  const issues = computed(() => calendarIssues(draft.value));
  const canSave = computed(() => issues.value.length === 0);
  const validationMessage = computed(() => issues.value[0] ?? null);

  const draftStats = computed(() => formatCalendarStats(draft.value));

  const references = computed(() =>
    currentCalendar.value ? store.calendarReferences(currentCalendar.value.id) : null,
  );
  const canDelete = computed(() => references.value !== null && references.value.total === 0);

  /** Пункты выбора шаблона недели: справочник шаблонов недели. */
  const weekPatternOptions = computed(() =>
    weekPatternStore.patterns.map((pattern) => ({ id: pattern.id, name: pattern.name })),
  );

  const patternsById = computed(
    () =>
      new Map(
        weekPatternStore.patterns.map((pattern) => [
          pattern.id,
          { name: pattern.name, color: pattern.color },
        ]),
      ),
  );

  const weekViews = computed<CalendarWeekView[]>(() =>
    calendarWeekViews(draft.value, patternsById.value),
  );

  const selectedWeek = computed<CalendarWeekView | null>(
    () => weekViews.value.find((week) => week.index === selectedWeekIndex.value) ?? null,
  );

  const holidayRanges = computed<HolidayRange[]>(() => groupHolidayRanges(draft.value.holidays));

  const listItems = computed<AcademicCalendarListItem[]>(() => {
    const items: AcademicCalendarListItem[] = store.calendars.map((calendar) => ({
      key: calendar.id,
      title: calendar.name,
      subtitle: formatCalendarStats(calendar),
    }));
    if (isNew.value) {
      items.unshift({
        key: DRAFT_KEY,
        title: draft.value.name.trim() || 'Новый календарь',
        subtitle: draftStats.value,
      });
    }
    return items;
  });

  /* Переключение и создание */

  function requestDiscard(action: () => void): void {
    confirm.value = {
      title: 'Несохранённые изменения',
      description: 'Изменения текущего календаря не сохранены. Продолжить и потерять их?',
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

  /** Дублирует текущий черновик в новый несохранённый календарь. */
  function duplicate(): void {
    const source = draft.value;
    const apply = () =>
      loadSelection(null, {
        ...source,
        id: null,
        name: `${source.name.trim() || 'Календарь'} (копия)`,
        overrides: source.overrides.map((override) => ({ ...override })),
        holidays: [...source.holidays],
      });
    if (hasUnsavedChanges.value) requestDiscard(apply);
    else apply();
  }

  /* Сохранение и удаление */

  function revert(): void {
    if (isNew.value) {
      loadSelection(store.calendars[0]?.id ?? null);
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
    const request = normalizeCalendarDraft(draft.value);

    try {
      if (id === null) {
        const created = await store.addCalendar(request);
        loadSelection(created.id);
      } else {
        await store.editCalendar({ id, ...request });
        loadSelection(id);
      }
    } catch (caught) {
      error.value = errorMessage(caught, 'Не удалось сохранить календарь');
    }
  }

  async function removeCalendar(id: string): Promise<void> {
    try {
      await store.removeCalendar(id);
      loadSelection(store.calendars[0]?.id ?? null);
    } catch (caught) {
      error.value = errorMessage(caught, 'Не удалось удалить календарь');
    }
  }

  function askRemove(): void {
    const calendar = currentCalendar.value;
    if (!calendar) return;
    const blocked = store.calendarReferences(calendar.id).total > 0;
    confirm.value = {
      title: `Удалить календарь «${calendar.name}»?`,
      description: blocked
        ? 'Календарь используется проектом. Сначала назначьте проекту другой календарь.'
        : 'Календарь будет удалён вместе с разметкой недель. Действие необратимо.',
      confirmLabel: 'Удалить',
      destructive: true,
      blocked,
      action: () => void removeCalendar(calendar.id),
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

  /* Недели и замена шаблона */

  function openWeek(index: number): void {
    selectedWeekIndex.value = index;
  }

  function closeWeek(): void {
    selectedWeekIndex.value = null;
  }

  /**
   * Назначает неделе свой шаблон. `null` и шаблон по умолчанию убирают замену:
   * эффективный шаблон недели тогда совпадает с `defaultPatternId`.
   */
  function setWeekOverride(index: number, patternId: string | null): void {
    const overrides = draft.value.overrides;
    const position = overrides.findIndex((override) => override.weekIndex === index);
    if (patternId === null || patternId === draft.value.defaultPatternId) {
      if (position !== -1) overrides.splice(position, 1);
      return;
    }
    if (position !== -1) overrides[position] = { weekIndex: index, patternId };
    else overrides.push({ weekIndex: index, patternId });
  }

  /* Настройки календаря */

  /** Убирает замены и праздники, выпавшие из периода после правки дат. */
  function pruneToPeriod(): void {
    if (!Number.isInteger(draft.value.weeks) || draft.value.weeks < 1) return;
    draft.value.overrides = draft.value.overrides.filter(
      (override) => override.weekIndex >= 1 && override.weekIndex <= draft.value.weeks,
    );
    // Пустая дата начала не должна стирать праздники: их диапазон неизвестен.
    if (!isValidISODate(draft.value.startDate)) return;
    draft.value.holidays = draft.value.holidays.filter((date) =>
      isDateInCalendar(draft.value, parseISODate(date)),
    );
  }

  function setName(value: string): void {
    draft.value.name = value;
  }

  function setStartDate(value: string): void {
    draft.value.startDate = value;
    pruneToPeriod();
  }

  function setWeeks(value: number): void {
    if (!Number.isFinite(value)) return;
    draft.value.weeks = Math.trunc(value);
    pruneToPeriod();
  }

  function setDefaultPattern(patternId: string): void {
    draft.value.defaultPatternId = patternId;
    // Замена, совпавшая с новым шаблоном по умолчанию, становится лишней.
    draft.value.overrides = draft.value.overrides.filter(
      (override) => override.patternId !== patternId,
    );
  }

  /** Добавляет каникулы на диапазон дат включительно (UC-1.4). */
  function addHolidayRange(from: string, to: string): void {
    if (!from || !to) {
      holidayError.value = 'Укажите начало и конец каникул';
      return;
    }
    const dates = expandHolidayRange(parseISODate(from), parseISODate(to));
    if (dates.some((date) => !isDateInCalendar(draft.value, parseISODate(date)))) {
      holidayError.value = 'Даты каникул должны входить в период календаря';
      return;
    }
    holidayError.value = null;
    draft.value.holidays = [...new Set([...draft.value.holidays, ...dates])].sort();
  }

  function removeHolidays(dates: string[]): void {
    const removing = new Set(dates);
    draft.value.holidays = draft.value.holidays.filter((date) => !removing.has(date));
    holidayError.value = null;
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
      canDelete.value ? 'Удалить календарь' : 'Календарь используется проектом',
    ),
    error,
    holidayError,
    confirm,
    issues,
    weekViews,
    weekPatternOptions,
    selectedWeek,
    holidayRanges,
    settingsVisible,
    select,
    create,
    duplicate,
    revert,
    save,
    askRemove,
    confirmAction,
    cancelConfirm,
    openWeek,
    closeWeek,
    setWeekOverride,
    setName,
    setStartDate,
    setWeeks,
    setDefaultPattern,
    addHolidayRange,
    removeHolidays,
    toggleSettings,
  };
}

export type AcademicCalendarEditorSession = ReturnType<typeof useAcademicCalendarEditor>;
