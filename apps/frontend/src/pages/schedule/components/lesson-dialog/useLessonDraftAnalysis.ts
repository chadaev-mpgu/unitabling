import type { FormContext } from 'vee-validate';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

import { analyzeLessonDraft } from '@/domain/lesson-draft.ts';

import { DATE_FORMAT, PARITY_OPTIONS } from './constants.ts';
import type { LessonFormValues } from './types.ts';
import { useLessonDialog } from './useLessonDialog.ts';

function formatDayMonth(date: Date): string {
  return DATE_FORMAT.format(date);
}

/**
 * Анализ черновика: вхождения по неделям и конфликты (docs/data-model/conflicts.md).
 * Читает контекст дропа из сессии диалога и текущие значения формы.
 */
export function useLessonDraftAnalysis(
  form: FormContext<LessonFormValues>,
  slotCount: MaybeRefOrGetter<number>,
) {
  const session = useLessonDialog();

  const analysis = computed(() => {
    const day = session.day.value;
    const slot = session.slot.value;
    if (!session.isOpen.value || !day || !slot) return null;

    const { weekFrom, weekTo } = form.values;
    if (!weekFrom || !weekTo || weekFrom > weekTo) return null;

    return analyzeLessonDraft(
      {
        calendar: session.calendar.value,
        weekday: day.key,
        slotIndex: slot.number,
        slotCount: toValue(slotCount),
        parity: form.values.parity,
        weekRange: { from: weekFrom, to: weekTo },
        teacherId: form.values.teacherId,
        roomId: form.values.roomId,
        groupIds: session.load.value?.groupIds ?? [],
        now: session.now.value,
      },
      {
        lessons: session.analysisLessons.value,
        rooms: session.rooms.value,
        studentGroups: session.studentGroups.value,
      },
    );
  });

  const preview = computed(() => analysis.value?.preview ?? null);
  const errors = computed(
    () => analysis.value?.conflicts.filter(({ severity }) => severity === 'error') ?? [],
  );
  const warnings = computed(
    () => analysis.value?.conflicts.filter(({ severity }) => severity === 'warning') ?? [],
  );
  /**
   * Раскладка клетки: урок не должен встать в занятую половину или поверх
   * `Both`. Для Exam/Credit парность форсится в `Both`, поэтому проверяем
   * именно итоговое значение, а не выбор формы.
   */
  const layoutError = computed<string | null>(() => {
    if (!session.isOpen.value) return null;
    if (session.isSingleWeek.value) {
      return session.isCellEmpty.value
        ? null
        : 'Экзамен/зачёт занимает всю клетку — выберите пустую клетку';
    }
    return session.allowedParities.value.includes(form.values.parity)
      ? null
      : 'Эта половина клетки уже занята';
  });

  /**
   * Прошедшие недели нельзя назначать началом диапазона: сохранение
   * запрещено, пока «с» — прошедшая неделя (UC-4.1). Диапазон должен
   * начинаться с недели, вхождение которой ещё впереди.
   */
  const rangeError = computed<string | null>(() => {
    const current = analysis.value;
    if (!current) return null;
    if (current.effectiveWeekRange.from > current.effectiveWeekRange.to) {
      return 'Выбранные недели уже прошли — занятие можно поставить только на будущие';
    }
    const trimmed = current.trimmedWeeks;
    if (trimmed.length) {
      const label =
        trimmed.length > 1
          ? `Недели ${trimmed[0]}–${trimmed[trimmed.length - 1]} уже прошли`
          : `Неделя ${trimmed[0]} уже прошла`;
      return `${label} — диапазон может начинаться не раньше недели ${current.effectiveWeekRange.from}`;
    }
    return null;
  });

  const hasBlockingConflicts = computed(
    () => errors.value.length > 0 || layoutError.value !== null || rangeError.value !== null,
  );

  const occurrenceRangeLabel = computed(() => {
    const occurrences = preview.value?.occurrences ?? [];
    const first = occurrences.at(0);
    const last = occurrences.at(-1);
    if (!first || !last) return '';
    return `${formatDayMonth(first.date)} — ${formatDayMonth(last.date)}`;
  });

  const weekRangeSummary = computed(() => {
    const { weekFrom, weekTo } = form.values;
    const weeksLabel = weekFrom === weekTo ? `Неделя ${weekFrom}` : `Недели ${weekFrom}–${weekTo}`;
    if (session.isSingleWeek.value) return weeksLabel;
    const parity =
      PARITY_OPTIONS.find((option) => option.value === form.values.parity)?.summary ?? '';
    return `${weeksLabel} · ${parity}`;
  });

  return {
    preview,
    errors,
    warnings,
    layoutError,
    rangeError,
    hasBlockingConflicts,
    occurrenceRangeLabel,
    weekRangeSummary,
  };
}
