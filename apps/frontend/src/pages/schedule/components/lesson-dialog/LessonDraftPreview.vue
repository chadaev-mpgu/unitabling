<script setup lang="ts">
import type { Conflict } from '@/domain/conflict.ts';

interface Props {
  occurrenceCount: number;
  occurrenceRangeLabel: string;
  weekRangeSummary: string;
  warnings: Conflict[];
  errors: Conflict[];
  /** Урок не помещается в клетку (занятая половина или `Both` поверх пары). */
  layoutError?: string | null;
  /** Начало диапазона — прошедшая неделя: сохранение запрещено. */
  rangeError?: string | null;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
    <p class="font-medium">
      Вхождений: {{ occurrenceCount }}
      <span v-if="occurrenceRangeLabel" class="font-normal text-muted-foreground">
        · {{ occurrenceRangeLabel }}
      </span>
    </p>
    <p class="text-muted-foreground">{{ weekRangeSummary }}</p>

    <p v-for="warning in warnings" :key="warning.type" class="text-attention">
      {{ warning.message }}
    </p>
    <p v-if="rangeError" class="text-destructive">{{ rangeError }}</p>
    <p v-if="layoutError" class="text-destructive">{{ layoutError }}</p>
    <p v-for="error in errors" :key="error.type" class="text-destructive">
      {{ error.message }}
    </p>
  </div>
</template>
