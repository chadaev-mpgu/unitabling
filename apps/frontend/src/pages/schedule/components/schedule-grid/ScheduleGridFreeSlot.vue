<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { WeekParity, type WeekParitySide } from '@/domain/week.ts';

import {
  SCHEDULE_LOAD_DND_TYPE,
  isScheduleLoadDrag,
  type ScheduleDay,
  type ScheduleLoadDrop,
  type ScheduleSlot,
  type ScheduleSlotClick,
} from './types.ts';

interface Props {
  day: ScheduleDay;
  /** Пара; имя не `slot` — Vue-линтер считает такой атрибут устаревшим. */
  scheduleSlot: ScheduleSlot;
  /** Половина клетки; не задана — свободна вся клетка. */
  parity?: WeekParitySide;
  /** Прошедшая позиция: не принимает drop и клик, показывает только пометку. */
  locked?: boolean;
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** Перенос карточки нагрузки в свободную позицию. */
  'load-drop': [payload: ScheduleLoadDrop];
  /** Клик по свободной позиции — добавить занятие. */
  'slot-click': [payload: ScheduleSlotClick];
}>();

/** Курсор с карточкой нагрузки сейчас над этой позицией. */
const isDragOver = ref(false);

const parityLabel = computed(() => {
  if (props.parity === WeekParity.Above) return ', нечётные недели';
  if (props.parity === WeekParity.Below) return ', чётные недели';
  return '';
});

function onDragOver(event: DragEvent) {
  if (!isScheduleLoadDrag(event)) return;
  // Только наша нагрузка разрешает drop: без preventDefault браузер не даст
  // бросить сюда файл или текст.
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
  isDragOver.value = true;
}

function onDragLeave(event: DragEvent) {
  // Переход на дочерний элемент — подсветку не снимаем.
  const current = event.currentTarget;
  const related = event.relatedTarget;
  if (current instanceof Element && related instanceof Node && current.contains(related)) return;
  isDragOver.value = false;
}

function onDrop(event: DragEvent) {
  if (!isScheduleLoadDrag(event)) return;
  isDragOver.value = false;
  const loadId = event.dataTransfer?.getData(SCHEDULE_LOAD_DND_TYPE);
  if (!loadId) return;
  emit('load-drop', { day: props.day, slot: props.scheduleSlot, loadId, parity: props.parity });
}
</script>

<template>
  <div
    v-if="locked"
    data-slot="schedule-grid-past"
    :data-parity="parity"
    class="rounded-sm bg-muted/40"
    :class="props.class"
    title="Пара уже прошла — поставить занятие нельзя"
    aria-disabled="true"
  />

  <button
    v-else
    type="button"
    data-slot="schedule-grid-empty"
    :data-parity="parity"
    class="flex items-center justify-center rounded-sm bg-muted outline-none transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
    :class="
      cn(
        isDragOver && 'bg-primary/5 outline outline-2 -outline-offset-2 outline-primary/50',
        props.class,
      )
    "
    :aria-label="`Добавить занятие: ${day.label}, ${scheduleSlot.number} пара${parityLabel}`"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
    @click="emit('slot-click', { day, slot: scheduleSlot, parity })"
  >
    <Plus class="size-4 text-muted-foreground" />
  </button>
</template>
