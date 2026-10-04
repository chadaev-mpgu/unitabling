<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { ref } from 'vue';
import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/vue';
import { PopoverContent, PopoverRoot, PopoverTrigger } from 'reka-ui';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { weekRangeLabel } from '@/lib/date.ts';

import type { Week } from './types.ts';
import { useWeekPages } from './useWeekPages.ts';

interface Props {
  /** Выбранная неделя (v-model) — индекс недели. */
  modelValue?: number | null;
  /** Набор выделенных недель (например, пара недель периода); переопределяет `modelValue`. */
  selectedIndexes?: number[];
  /** Первый день периода (используется, если не передан `weeks`). */
  startDate?: Date | string;
  /** Последний день периода. */
  endDate?: Date | string;
  /** Явный список недель — переопределяет расчёт из `startDate`/`endDate`. */
  weeks?: Week[];
  /** День начала недели: 0 = воскресенье, 1 = понедельник (по умолчанию). */
  weekStartsOn?: number;
  /** Сколько недель показывать на одной странице. */
  pageSize?: number;
  /** Сторона открытия всплывающей карточки. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Выравнивание всплывающей карточки. */
  align?: 'start' | 'center' | 'end';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  selectedIndexes: undefined,
  startDate: undefined,
  endDate: undefined,
  weeks: undefined,
  weekStartsOn: 1,
  pageSize: 12,
  side: 'bottom',
  align: 'start',
});

const emit = defineEmits<{
  'update:modelValue': [index: number];
  select: [week: Week];
}>();

const open = ref(false);

const {
  page,
  pageWeeks,
  headerLabel,
  headerRange,
  disablePrevious,
  disableNext,
  selectedIndexes,
  triggerLabel,
} = useWeekPages(props);

function isSelected(week: Week) {
  return selectedIndexes.value.includes(week.index);
}

function isCurrentWeek(week: Week) {
  const now = new Date();
  return now >= week.start && now <= week.end;
}

function weekAriaLabel(week: Week) {
  const range = week.label ?? weekRangeLabel(week.start, week.end);
  return `Неделя ${week.index}, ${range}`;
}

function selectWeek(week: Week) {
  emit('update:modelValue', week.index);
  emit('select', week);
  open.value = false;
}

function previousPage() {
  if (!disablePrevious.value) page.value--;
}

function nextPage() {
  if (!disableNext.value) page.value++;
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button
          variant="secondary"
          :class="cn('justify-start gap-2', props.class)"
          :aria-label="`Выбрать неделю: ${triggerLabel}`"
        >
          <CalendarDays class="size-4 shrink-0" />
        </Button>
      </slot>
    </PopoverTrigger>

    <PopoverContent
      :side="side"
      :align="align"
      :class="
        cn(
          'bg-popover text-popover-foreground relative z-50 w-[320px] overflow-hidden rounded-lg border p-0 shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )
      "
    >
      <div data-slot="week-picker">
        <div
          data-slot="week-picker-header"
          class="flex items-center justify-between gap-1 border-b px-2 py-1.5"
        >
          <Button
            variant="ghost"
            class="size-8 shrink-0 rounded-md px-0"
            :disabled="disablePrevious"
            aria-label="Предыдущая страница недель"
            @click="previousPage"
          >
            <ChevronLeft class="size-4" />
          </Button>

          <div class="flex min-w-0 flex-1 flex-col items-center">
            <span class="text-sm font-medium leading-tight">{{ headerLabel }}</span>
            <span class="text-[11px] leading-tight text-muted-foreground">{{ headerRange }}</span>
          </div>

          <Button
            variant="ghost"
            class="size-8 shrink-0 rounded-md px-0"
            :disabled="disableNext"
            aria-label="Следующая страница недель"
            @click="nextPage"
          >
            <ChevronRight class="size-4" />
          </Button>
        </div>

        <div data-slot="week-picker-grid" class="grid grid-cols-3 gap-1.5 p-3">
          <button
            v-for="week in pageWeeks"
            :key="week.index"
            type="button"
            data-slot="week-picker-cell"
            :data-selected="isSelected(week) ? 'true' : undefined"
            :data-today="!isSelected(week) && isCurrentWeek(week) ? 'true' : undefined"
            :aria-label="weekAriaLabel(week)"
            :aria-pressed="isSelected(week)"
            class="group flex flex-col items-center justify-center gap-0.5 rounded-md border border-transparent px-1.5 py-2 text-sm font-semibold outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[today=true]:border-border data-[today=true]:bg-accent data-[today=true]:text-accent-foreground data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary data-[selected=true]:hover:text-primary-foreground"
            @click="selectWeek(week)"
          >
            <span>{{ week.index }}</span>
            <span
              class="text-[10px] font-normal leading-tight text-muted-foreground group-data-[selected=true]:text-primary-foreground/80"
            >
              {{ week.label ?? weekRangeLabel(week.start, week.end) }}
            </span>
          </button>
        </div>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>
