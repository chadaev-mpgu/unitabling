<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { dayMonthNumeric } from '@/lib/date.ts';
import {
  buildScheduleCellLayout,
  type ScheduleCellLayout,
  type ScheduleLesson,
} from '@/domain/schedule-view.ts';
import { WeekParity, type WeekParitySide } from '@/domain/week.ts';

import LessonCard from './LessonCard.vue';
import ScheduleGridFreeSlot from './ScheduleGridFreeSlot.vue';
import {
  scheduleCellKey,
  type ScheduleCellFocus,
  type ScheduleDay,
  type ScheduleLessonClick,
  type ScheduleLoadDrop,
  type ScheduleSlot,
  type ScheduleSlotClick,
} from './types.ts';

interface Props {
  /** Дни недели — колонки таблицы (ПН…СБ). */
  days: ScheduleDay[];
  /** Пары — строки таблицы. */
  slots: ScheduleSlot[];
  /** Занятия — карточки; раскладываются по ячейкам «день × пара». */
  lessons?: ScheduleLesson[];
  /**
   * Уроки для расчёта занятости половин: половина остаётся занятой, даже если
   * её урок не попадает в отображаемый период. По умолчанию — `lessons`.
   */
  layoutLessons?: ScheduleLesson[];
  /** Парности половин, существующие в периоде; по умолчанию — обе. */
  parities?: WeekParitySide[];
  /**
   * Прошедшие половины клетки: время вхождения уже наступило, постановка
   * и правка невозможны (docs/use-cases/04-scheduling.md, UC-4.1).
   */
  pastParities?: (day: ScheduleDay, scheduleSlot: ScheduleSlot) => WeekParitySide[];
  /** Ширина колонки с номерами пар, px. */
  slotWidth?: number;
  /** Минимальная ширина колонки дня, px. */
  dayWidth?: number;
  /**
   * Клетка для перехода из панели конфликтов: сетка прокручивает её
   * в зону видимости и подсвечивает. Новый объект — новый переход.
   */
  focusCell?: ScheduleCellFocus | null;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  lessons: () => [],
  layoutLessons: undefined,
  parities: () => [WeekParity.Above, WeekParity.Below],
  pastParities: undefined,
  slotWidth: 96,
  dayWidth: 160,
  focusCell: null,
});

const emit = defineEmits<{
  /** Клик по свободной позиции — добавить занятие. */
  'slot-click': [payload: ScheduleSlotClick];
  /** Клик по карточке занятия. */
  'lesson-click': [payload: ScheduleLessonClick];
  /** Перенос карточки нагрузки из панели «Текущая нагрузка» в ячейку. */
  'load-drop': [payload: ScheduleLoadDrop];
}>();

/** Позиция клетки для рендера: занята уроками или свободна. */
interface CellHalf {
  key: 'full' | 'above' | 'below' | 'empty';
  /** Половина клетки; не задана — позиция занимает всю клетку. */
  parity?: WeekParitySide;
  lessons: ScheduleLesson[];
  /** Свободная позиция: показывает «+» и принимает drop. */
  free: boolean;
  /** Прошедшая позиция: без «+» и drop, только пометка. */
  locked: boolean;
}

/** Занятость половин: половина занята уроком серии, даже если карточки нет. */
const occupancyLessons = computed(() => props.layoutLessons ?? props.lessons);

/** Уроки для расчёта занятости, сгруппированные по ключу ячейки. */
const cellLayouts = computed(() => {
  const cells = new Map<string, ScheduleLesson[]>();
  for (const lesson of occupancyLessons.value) {
    const key = scheduleCellKey(lesson.day, lesson.slotId);
    const bucket = cells.get(key);
    if (bucket) bucket.push(lesson);
    else cells.set(key, [lesson]);
  }

  const layouts = new Map<string, ScheduleCellLayout<ScheduleLesson>>();
  for (const [key, bucket] of cells) layouts.set(key, buildScheduleCellLayout(bucket));
  return layouts;
});

/** Карточки, сгруппированные по ключу ячейки. */
const cellCards = computed(() => {
  const cells = new Map<string, ScheduleLesson[]>();
  for (const lesson of props.lessons) {
    const key = scheduleCellKey(lesson.day, lesson.slotId);
    const bucket = cells.get(key);
    if (bucket) bucket.push(lesson);
    else cells.set(key, [lesson]);
  }
  return cells;
});

/** Раскладка пустой клетки — общая константа: массивы не мутируются. */
const EMPTY_CELL_LAYOUT: ScheduleCellLayout<ScheduleLesson> = buildScheduleCellLayout([]);

function layoutAt(day: ScheduleDay, slot: ScheduleSlot): ScheduleCellLayout<ScheduleLesson> {
  return cellLayouts.value.get(scheduleCellKey(day.key, slot.id)) ?? EMPTY_CELL_LAYOUT;
}

function cardsAt(day: ScheduleDay, slot: ScheduleSlot): ScheduleLesson[] {
  return cellCards.value.get(scheduleCellKey(day.key, slot.id)) ?? [];
}

/**
 * Раскладывает клетку на позиции: занятость — по `layoutLessons`, карточки —
 * по вхождениям периода. Половина, занятая уроком вне недель периода, остаётся
 * без карточки и без «+»; половины, которых нет в периоде, не рендерятся.
 * Прошедшие половины не принимают постановку — показываются без «+».
 */
function cellHalves(
  day: ScheduleDay,
  slot: ScheduleSlot,
  layout: ScheduleCellLayout<ScheduleLesson>,
  cards: ScheduleLesson[],
): CellHalf[] {
  const cardsOf = (parity: WeekParity) => cards.filter((lesson) => lesson.displayParity === parity);
  const allowed = (half: CellHalf) => !half.parity || props.parities.includes(half.parity);
  const past = props.pastParities?.(day, slot) ?? [];
  const freeSide = (parity: WeekParitySide): CellHalf => ({
    key: parity === WeekParity.Above ? 'above' : 'below',
    parity,
    lessons: [],
    free: true,
    locked: false,
  });
  const lockedSide = (parity: WeekParitySide): CellHalf => ({
    ...freeSide(parity),
    free: false,
    locked: true,
  });

  // Клетка занята целиком (`Both` или аномалия из старых данных): drop запрещён.
  if (layout.full.length) {
    const halves: CellHalf[] = [
      { key: 'full', lessons: cardsOf(WeekParity.Both), free: false, locked: false },
      {
        key: 'above',
        parity: WeekParity.Above,
        lessons: cardsOf(WeekParity.Above),
        free: false,
        locked: false,
      },
      {
        key: 'below',
        parity: WeekParity.Below,
        lessons: cardsOf(WeekParity.Below),
        free: false,
        locked: false,
      },
    ];
    return halves.filter((half) => allowed(half) && half.lessons.length > 0);
  }

  // Пустая клетка: свободны обе половины — одна кнопка «+» на всю клетку;
  // если часть половин уже прошла, каждая половина показывается на своём
  // месте — прошедшая закрыта (закрывается по мере прохождения конкретного
  // времени пары в конкретную дату).
  if (!layout.above.length && !layout.below.length) {
    const futureSides = props.parities.filter((parity) => !past.includes(parity));
    if (!futureSides.length) {
      return [{ key: 'empty', lessons: [], free: false, locked: true }];
    }
    if (futureSides.length === props.parities.length) {
      return [{ key: 'empty', lessons: [], free: true, locked: false }];
    }
    return props.parities.map((parity) =>
      futureSides.includes(parity) ? freeSide(parity) : lockedSide(parity),
    );
  }

  // Занята одна половина — вторая свободна, если ещё не прошла.
  const halves: CellHalf[] = [
    {
      key: 'above',
      parity: WeekParity.Above,
      lessons: cardsOf(WeekParity.Above),
      free: layout.above.length === 0 && !past.includes(WeekParity.Above),
      locked: layout.above.length === 0 && past.includes(WeekParity.Above),
    },
    {
      key: 'below',
      parity: WeekParity.Below,
      lessons: cardsOf(WeekParity.Below),
      free: layout.below.length === 0 && !past.includes(WeekParity.Below),
      locked: layout.below.length === 0 && past.includes(WeekParity.Below),
    },
  ];
  return halves.filter(
    (half) => allowed(half) && (half.lessons.length > 0 || half.free || half.locked),
  );
}

/** Строки сетки: пара и ячейки дней с готовыми позициями. */
const rows = computed(() =>
  props.slots.map((slot) => ({
    slot,
    cells: props.days.map((day) => ({
      day,
      halves: cellHalves(day, slot, layoutAt(day, slot), cardsAt(day, slot)),
    })),
  })),
);

/** Клик по прошедшей карточке ничего не открывает: это история (UC-4.3). */
function onCardClick(day: ScheduleDay, slot: ScheduleSlot, lesson: ScheduleLesson) {
  if (lesson.locked) return;
  emit('lesson-click', { day, slot, lesson });
}

/** Даты недель периода в шапке колонки: «05.10 / 12.10». */
function dayDatesLabel(day: ScheduleDay): string {
  return [day.dates?.above, day.dates?.below]
    .filter((date): date is Date => Boolean(date))
    .map(dayMonthNumeric)
    .join(' / ');
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `${props.slotWidth}px repeat(${props.days.length}, minmax(0, 1fr))`,
  minWidth: `${props.slotWidth + props.days.length * props.dayWidth}px`,
}));

/* Переход к клетке из панели конфликтов */

/** Сколько держится подсветка клетки после перехода, мс. */
const FOCUS_HIGHLIGHT_MS = 2400;

/** Корень сетки — область поиска клетки для прокрутки. */
const gridRoot = ref<HTMLElement | null>(null);
/** Клетка с активной подсветкой; null — подсветки нет. */
const highlightedKey = ref<string | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | undefined;

/** Прокручивает клетку в зону видимости и подсвечивает её. */
function focusOnCell(focus: ScheduleCellFocus): void {
  const key = scheduleCellKey(focus.day, focus.slotId);
  highlightedKey.value = key;

  // Клетка может появиться только следующим рендером: сетку могло не быть
  // на странице, пока конфликт не выбрал сущность вида. `inline: nearest`
  // не сдвигает сетку по горизонтали, если клетка и так видна.
  void nextTick(() => {
    gridRoot.value
      ?.querySelector(`[data-cell-key="${key}"]`)
      ?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  });

  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightedKey.value = null;
  }, FOCUS_HIGHLIGHT_MS);
}

watch(
  () => props.focusCell,
  (focus) => focus && focusOnCell(focus),
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(highlightTimer));

function isHighlighted(day: ScheduleDay, slot: ScheduleSlot): boolean {
  return highlightedKey.value === scheduleCellKey(day.key, slot.id);
}
</script>

<template>
  <ScrollArea
    orientation="both"
    :class="cn('rounded-lg border border-border bg-background shadow-sm', props.class)"
  >
    <div ref="gridRoot" data-slot="schedule-grid" class="grid" :style="gridStyle">
      <!-- Шапка: колонка пар и дни недели -->
      <div
        data-slot="schedule-grid-corner"
        class="sticky top-0 left-0 z-30 flex h-12 items-center justify-center border-r border-b border-border bg-mist-50 px-2 text-xs font-semibold text-muted-foreground"
      >
        ПАРА
      </div>
      <div
        v-for="(day, dayIndex) in days"
        :key="day.key"
        data-slot="schedule-grid-day"
        class="sticky top-0 z-20 flex h-12 flex-col items-center justify-center border-b border-border bg-mist-50 px-2 text-xs font-semibold text-foreground"
        :class="cn(dayIndex < days.length - 1 && 'border-r')"
      >
        <span>{{ day.label }}</span>
        <span
          v-if="day.dates"
          data-slot="schedule-grid-day-dates"
          class="text-[10px] font-normal leading-4 text-muted-foreground"
        >
          {{ dayDatesLabel(day) }}
        </span>
      </div>

      <!-- Строки: пары и ячейки дней -->
      <template v-for="(row, slotIndex) in rows" :key="row.slot.id">
        <div
          data-slot="schedule-grid-slot"
          class="sticky left-0 z-10 flex min-h-[90px] flex-col items-center border-r border-border bg-mist-50 px-2 pt-3"
          :class="cn(slotIndex < slots.length - 1 && 'border-b')"
        >
          <span class="text-base font-bold leading-6">{{ row.slot.number }}</span>
          <span
            v-if="row.slot.times.length"
            class="mt-0.5 flex flex-col text-[10px] leading-4 text-muted-foreground"
          >
            <span v-for="time in row.slot.times" :key="time">{{ time }}</span>
          </span>
        </div>

        <div
          v-for="(cell, dayIndex) in row.cells"
          :key="cell.day.key"
          data-slot="schedule-grid-cell"
          :data-cell-key="scheduleCellKey(cell.day.key, row.slot.id)"
          class="flex min-h-[90px] flex-col gap-1.5 p-1 transition-shadow duration-300"
          :class="
            cn(
              dayIndex < days.length - 1 && 'border-r border-border',
              slotIndex < slots.length - 1 && 'border-b border-border',
              isHighlighted(cell.day, row.slot) && 'ring-2 ring-primary/70 ring-inset',
            )
          "
        >
          <div
            v-for="half in cell.halves"
            :key="half.key"
            class="flex flex-1 flex-col gap-1.5"
            :data-parity="half.parity"
          >
            <LessonCard
              v-for="lesson in half.lessons"
              :key="lesson.id"
              :subject="lesson.subject"
              :teacher="lesson.teacher"
              :room="lesson.room"
              :color="lesson.color"
              :warning="lesson.warning"
              :locked="lesson.locked"
              class="flex-1"
              :class="cn(lesson.locked ? 'cursor-default' : 'cursor-pointer')"
              @click="onCardClick(cell.day, row.slot, lesson)"
            />

            <ScheduleGridFreeSlot
              v-if="half.free || half.locked"
              :day="cell.day"
              :schedule-slot="row.slot"
              :parity="half.parity"
              :locked="half.locked"
              class="flex-1"
              @load-drop="emit('load-drop', $event)"
              @slot-click="emit('slot-click', $event)"
            />
          </div>
        </div>
      </template>
    </div>
  </ScrollArea>
</template>
