<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { ref } from 'vue';
import { ArrowRight, ChevronDown, TriangleAlert } from '@lucide/vue';

import type { ProjectConflict } from '@/domain/conflict.ts';
import { cn } from '@/lib/utils.ts';

interface Props {
  /** Конфликты проекта: ошибки первыми, затем предупреждения. */
  conflicts: ProjectConflict[];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** «Перейти к ячейке»: показать вид конфликта и подсветить клетку. */
  navigate: [conflict: ProjectConflict];
}>();

/** Развёрнутый список; свёрнутый док оставляет только шапку со счётчиком. */
const isOpen = ref(true);

/** Оформление строки по severity: ошибка — красная, warning — нейтральная. */
function severityClasses(severity: ProjectConflict['severity']) {
  return severity === 'error'
    ? {
        row: 'border-l-destructive hover:bg-destructive-subtle',
        title: 'text-destructive',
        hint: 'text-destructive/80',
        arrow: 'text-destructive',
      }
    : {
        row: 'border-l-attention hover:bg-attention-subtle',
        title: 'text-foreground',
        hint: 'text-muted-foreground',
        arrow: 'text-muted-foreground',
      };
}
</script>

<template>
  <section
    data-slot="schedule-conflict-dock"
    :class="
      cn('overflow-hidden rounded-lg border border-border bg-background shadow-sm', props.class)
    "
  >
    <button
      type="button"
      data-slot="schedule-conflict-dock-header"
      class="flex w-full items-center gap-2 px-3 py-2 text-left"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <TriangleAlert class="size-4 shrink-0 text-destructive" />
      <span class="text-sm font-semibold text-destructive">Конфликты ({{ conflicts.length }})</span>
      <ChevronDown
        data-slot="schedule-conflict-dock-chevron"
        class="ml-auto size-4 shrink-0 text-muted-foreground transition-transform"
        :class="cn(!isOpen && '-rotate-90')"
      />
    </button>

    <ul
      v-if="isOpen"
      data-slot="schedule-conflict-dock-list"
      class="max-h-56 overflow-y-auto border-t border-border"
    >
      <li v-for="conflict in conflicts" :key="conflict.id">
        <button
          type="button"
          data-slot="schedule-conflict-dock-item"
          :data-severity="conflict.severity"
          :class="
            cn(
              'group flex w-full items-center gap-3 border-l-4 px-3 py-2 text-left transition-colors',
              severityClasses(conflict.severity).row,
            )
          "
          @click="emit('navigate', conflict)"
        >
          <span class="min-w-0 flex-1">
            <span
              data-slot="schedule-conflict-dock-message"
              class="block truncate text-sm"
              :class="cn(severityClasses(conflict.severity).title)"
            >
              {{ conflict.message }}
            </span>
            <span
              data-slot="schedule-conflict-dock-action"
              class="block text-xs"
              :class="cn(severityClasses(conflict.severity).hint)"
            >
              Перейти к ячейке
            </span>
          </span>
          <ArrowRight
            class="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
            :class="cn(severityClasses(conflict.severity).arrow)"
          />
        </button>
      </li>
    </ul>
  </section>
</template>
