<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

import { listRowVariants, type ListRowVariants } from './index';

interface Props {
  /** Visual style of the row. */
  variant?: ListRowVariants['variant'];
  /** Color of the accent bar on the left edge — any CSS color (defaults to `--primary`). */
  markerColor?: string;
  /** Color of the background — any CSS color (defaults to `--muted`). */
  backgroundColor?: string;

  /** Подсветить маркер, не заливая фон (например, строка-кандидат). */
  marked?: boolean;
  /** Выделенная строка: залитый фон и цветной маркер (выбор, перетаскивание). */
  active?: boolean;

  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <div
    data-slot="list-row"
    :data-variant="variant"
    :class="cn(listRowVariants({ variant }), props.class)"
    :style="{ backgroundColor: active ? backgroundColor : undefined }"
  >
    <span
      data-slot="list-row-marker"
      aria-hidden="true"
      class="absolute inset-y-0 left-0 w-1.25"
      :style="{
        backgroundColor: !(marked || active) ? 'var(--border)' : (markerColor ?? 'var(--primary)'),
      }"
    />
    <slot />
  </div>
</template>
