<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { cn } from '@/lib/utils';
import { Color, resolveColor } from '@/domain/color.ts';

interface Props {
  /** Название дисциплины. */
  subject: string;
  /** Преподаватель. */
  teacher?: string;
  /** Аудитория. */
  room?: string;
  /** Цвет карточки из палитры расписания. */
  color?: Color;
  /** Конфликт: карточка получает красную рамку и значок предупреждения. */
  warning?: boolean;
  /** Все вхождения уже прошли: карточка — история, правка недоступна. */
  locked?: boolean;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  teacher: undefined,
  room: undefined,
  color: Color.Blue,
  warning: false,
  locked: false,
});

const palette = computed(() => resolveColor(props.color));

/** Вторая строка карточки: «Иванов И. И. · 101». */
const details = computed(() => [props.teacher, props.room].filter(Boolean).join(' · '));
</script>

<template>
  <div
    data-slot="lesson-card"
    :data-warning="warning || undefined"
    :data-locked="locked || undefined"
    :aria-disabled="locked || undefined"
    :title="locked ? 'Занятие уже прошло — изменения недоступны' : undefined"
    :class="
      cn(
        'relative flex min-h-12 flex-col rounded-sm px-2 py-1',
        warning && 'border-2 border-destructive',
        locked && 'opacity-60',
        props.class,
      )
    "
    :style="{
      backgroundColor: palette.background,
      color: palette.foreground,
      '--lesson-card-background': palette.background,
    }"
  >
    <div class="flex items-center gap-1.5">
      <span
        data-slot="lesson-card-title"
        class="min-w-0 flex-1 truncate text-xs font-bold leading-4"
      >
        {{ subject }}
      </span>

      <!--
        Значок конфликта: залитый треугольник с «вырезанным» восклицательным
        знаком (он закрашен цветом фона карточки). Контур взят у lucide
        `triangle-alert`, чтобы иконка не зависела от версии набора.
      -->
      <svg
        v-if="warning"
        data-slot="lesson-card-warning"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        class="size-4 shrink-0 text-destructive"
      >
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M12 9v4M12 17h.01"
          stroke="var(--lesson-card-background)"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <span
      v-if="details"
      data-slot="lesson-card-description"
      class="mt-0.5 truncate text-[10px] leading-4"
    >
      {{ details }}
    </span>
  </div>
</template>
