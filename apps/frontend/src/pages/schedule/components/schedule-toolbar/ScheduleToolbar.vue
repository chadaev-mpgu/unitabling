<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeekNavigator, WeekPicker } from '@/components/week';
import type { CalendarWeek } from '@/domain/academic-calendar.ts';
import type { Room } from '@/domain/room.ts';
import { ScheduleViewMode } from '@/domain/schedule-view.ts';
import type { StudentGroup } from '@/domain/student-group.ts';
import type { Teacher } from '@/domain/teacher.ts';
import { periodOfWeek, type WeekRange } from '@/domain/week.ts';
import { cn } from '@/lib/utils.ts';

interface Props {
  /** Режим просмотра: по группе / преподавателю / аудитории. */
  mode: ScheduleViewMode;
  /** id выбранной сущности; `null` — ничего не выбрано. */
  targetId: string | null;
  /** Период — пара недель: верх клетки — нечётная неделя, низ — чётная. */
  period: WeekRange;
  groups: StudentGroup[];
  teachers: Teacher[];
  rooms: Room[];
  /** Недели календаря — для пикера. */
  weeks: CalendarWeek[];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:mode': [mode: ScheduleViewMode];
  'update:targetId': [targetId: string];
  'update:period': [period: WeekRange];
}>();

const MODE_PLACEHOLDERS: Record<ScheduleViewMode, string> = {
  [ScheduleViewMode.Group]: 'Группа',
  [ScheduleViewMode.Teacher]: 'Преподаватель',
  [ScheduleViewMode.Room]: 'Аудитория',
};

interface TargetOption {
  id: string;
  label: string;
}

/** Опции текущего вида; справочник сортируется по подписи. */
const options = computed<TargetOption[]>(() => {
  if (props.mode === ScheduleViewMode.Group) {
    return [...props.groups]
      .sort((left, right) => left.name.localeCompare(right.name, 'ru', { numeric: true }))
      .map((group) => ({ id: group.id, label: group.name }));
  }
  if (props.mode === ScheduleViewMode.Teacher) {
    return [...props.teachers]
      .sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru'))
      .map((teacher) => ({ id: teacher.id, label: teacher.fullName }));
  }
  return [...props.rooms]
    .sort((left, right) => left.name.localeCompare(right.name, 'ru', { numeric: true }))
    .map((room) => ({ id: room.id, label: room.name }));
});

const placeholder = computed(() => MODE_PLACEHOLDERS[props.mode]);

const periodStart = computed(
  () => props.weeks.find((week) => week.index === props.period.from)?.start,
);
const periodEnd = computed(() => props.weeks.find((week) => week.index === props.period.to)?.end);

const periodLabel = computed(() =>
  props.period.from === props.period.to
    ? `Неделя ${props.period.from}`
    : `Недели ${props.period.from}–${props.period.to}`,
);

/** Переход к периоду, содержащему неделю; `periodOfWeek` держит границы календаря. */
function stepPeriod(weekIndex: number): void {
  emit('update:period', periodOfWeek(weekIndex, props.weeks.length));
}

function onModeChange(value: unknown): void {
  emit('update:mode', value as ScheduleViewMode);
}

function onTargetChange(value: unknown): void {
  emit('update:targetId', value as string);
}
</script>

<template>
  <div :class="cn('flex h-9 w-full items-center justify-between gap-3', props.class)">
    <div class="flex min-w-0 items-center gap-3">
      <Tabs :model-value="mode" @update:model-value="onModeChange">
        <TabsList>
          <TabsTrigger :value="ScheduleViewMode.Group">По группе</TabsTrigger>
          <TabsTrigger :value="ScheduleViewMode.Teacher">По преподавателю</TabsTrigger>
          <TabsTrigger :value="ScheduleViewMode.Room">По аудитории</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select :model-value="targetId ?? ''" @update:model-value="onTargetChange">
        <SelectTrigger class="w-[220px]">
          <SelectValue :placeholder="placeholder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in options" :key="option.id" :value="option.id">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex shrink-0 gap-3">
      <WeekNavigator
        v-if="periodStart && periodEnd"
        :label="periodLabel"
        :start-date="periodStart"
        :end-date="periodEnd"
        :disable-previous="period.from <= 1"
        :disable-next="period.to >= weeks.length"
        @previous="stepPeriod(period.from - 2)"
        @next="stepPeriod(period.to + 1)"
      />
      <WeekPicker
        side="bottom"
        :weeks="weeks"
        :model-value="period.from"
        :selected-indexes="[period.from, period.to]"
        @select="stepPeriod($event.index)"
      />
    </div>
  </div>
</template>
