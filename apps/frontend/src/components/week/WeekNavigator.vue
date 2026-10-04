<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toDate, weekRangeLabel } from '@/lib/date.ts';

interface Props {
  /** Подпись периода: «Недели 5–6» или «Неделя 17». */
  label: string;
  /** Первый день периода. */
  startDate: Date | string;
  /** Последний день периода. */
  endDate: Date | string;
  /** Блокирует переход к предыдущему периоду. */
  disablePrevious?: boolean;
  /** Блокирует переход к следующему периоду. */
  disableNext?: boolean;
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  previous: [];
  next: [];
}>();

const rangeLabel = computed(() => {
  const start = toDate(props.startDate);
  const end = toDate(props.endDate);
  if (!start || !end) return '';
  return weekRangeLabel(start, end);
});

const title = computed(() =>
  rangeLabel.value ? `${props.label} · ${rangeLabel.value}` : props.label,
);
</script>

<template>
  <div
    data-slot="week-navigator"
    :class="
      cn('inline-flex h-9 items-stretch rounded-md border border-border bg-background', props.class)
    "
  >
    <Button
      data-slot="week-navigator-previous"
      variant="ghost"
      class="h-auto w-8 rounded-l-md rounded-r-none px-0"
      :disabled="disablePrevious"
      aria-label="Предыдущая неделя"
      @click="emit('previous')"
    >
      <ChevronLeft :size="16" />
    </Button>

    <span
      data-slot="week-navigator-label"
      aria-live="polite"
      class="flex items-center justify-center border-x border-border px-3 text-sm font-medium whitespace-nowrap text-foreground"
    >
      {{ title }}
    </span>

    <Button
      data-slot="week-navigator-next"
      variant="ghost"
      class="h-auto w-8 rounded-r-md rounded-l-none px-0"
      :disabled="disableNext"
      aria-label="Следующая неделя"
      @click="emit('next')"
    >
      <ChevronRight :size="16" />
    </Button>
  </div>
</template>
