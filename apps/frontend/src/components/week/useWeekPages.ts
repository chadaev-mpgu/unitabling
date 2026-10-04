import { computed, ref, watch } from 'vue';

import { startOfWeek, toDate, weekRangeLabel } from '@/lib/date.ts';

import type { Week } from './types.ts';

export interface WeekPagesProps {
  /** Выбранная неделя (v-model) — индекс недели. */
  modelValue?: number | null;
  /** Набор выделенных недель; переопределяет одиночный `modelValue`. */
  selectedIndexes?: number[];
  /** Первый день периода (используется, если не передан `weeks`). */
  startDate?: Date | string;
  /** Последний день периода. */
  endDate?: Date | string;
  /** Явный список недель — переопределяет расчёт из `startDate`/`endDate`. */
  weeks?: Week[];
  /** День начала недели: 0 = воскресенье, 1 = понедельник. */
  weekStartsOn?: number;
  /** Сколько недель показывать на одной странице. */
  pageSize?: number;
}

/** Недели периода; границы расширяются до полных недель. */
function buildWeeks(startDate: Date, endDate: Date, weekStartsOn: number): Week[] {
  const weeks: Week[] = [];
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const cursor = startOfWeek(startDate, weekStartsOn);
  let index = 1;
  while (cursor <= end) {
    const start = new Date(cursor);
    const endOfWeek = new Date(cursor);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    weeks.push({ index, start, end: endOfWeek });
    cursor.setDate(cursor.getDate() + 7);
    index++;
  }
  return weeks;
}

/** Пагинация и подписи сетки недель; принимает реактивные props компонента. */
export function useWeekPages(props: WeekPagesProps) {
  const allWeeks = computed<Week[]>(() => {
    if (props.weeks?.length) return props.weeks;
    const start = toDate(props.startDate);
    const end = toDate(props.endDate);
    if (!start || !end) return [];
    return buildWeeks(start, end, props.weekStartsOn ?? 1);
  });

  const pageSize = computed(() => Math.max(1, props.pageSize ?? 12));
  const pageCount = computed(() => Math.max(1, Math.ceil(allWeeks.value.length / pageSize.value)));
  const page = ref(0);

  const pageWeeks = computed(() => {
    const start = page.value * pageSize.value;
    return allWeeks.value.slice(start, start + pageSize.value);
  });

  watch(allWeeks, () => {
    if (page.value > pageCount.value - 1) page.value = pageCount.value - 1;
  });

  /** Выделенные недели: явный набор или одиночный `modelValue`. */
  const selectedIndexes = computed(() => {
    if (props.selectedIndexes?.length) return props.selectedIndexes;
    return props.modelValue == null ? [] : [props.modelValue];
  });

  const selectedWeeks = computed(() =>
    [...selectedIndexes.value]
      .sort((left, right) => left - right)
      .map((index) => allWeeks.value.find((week) => week.index === index))
      .filter((week): week is Week => Boolean(week)),
  );

  const pageRange = computed(() => {
    const weeks = pageWeeks.value;
    const first = weeks.at(0);
    const last = weeks.at(-1);
    if (!first || !last) return null;
    return { first, last };
  });

  const headerLabel = computed(() => {
    const range = pageRange.value;
    if (!range) return '';
    if (range.first.index === range.last.index) return `Неделя ${range.first.index}`;
    return `Недели ${range.first.index} – ${range.last.index}`;
  });

  const headerRange = computed(() => {
    const range = pageRange.value;
    if (!range) return '';
    return weekRangeLabel(range.first.start, range.last.end);
  });

  const disablePrevious = computed(() => page.value <= 0);
  const disableNext = computed(() => page.value >= pageCount.value - 1);

  const triggerLabel = computed(() => {
    const weeks = selectedWeeks.value;
    const first = weeks[0];
    const last = weeks.at(-1);
    if (!first || !last) return 'Выберите неделю';
    if (first.index === last.index) {
      const range = first.label ?? weekRangeLabel(first.start, first.end);
      return `Неделя ${first.index} · ${range}`;
    }
    return `Недели ${first.index}–${last.index} · ${weekRangeLabel(first.start, last.end)}`;
  });

  return {
    page,
    pageWeeks,
    headerLabel,
    headerRange,
    disablePrevious,
    disableNext,
    selectedIndexes,
    triggerLabel,
  };
}
