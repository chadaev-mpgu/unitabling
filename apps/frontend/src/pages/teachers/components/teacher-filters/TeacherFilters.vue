<script setup lang="ts">
import { computed } from 'vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Discipline } from '@/domain/discipline.ts';
import { TEACHER_FILTER_ALL, type TeacherFilter } from '@/domain/teacher-view.ts';

interface Props {
  modelValue: TeacherFilter;
  disciplines: Discipline[];
  positions: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: TeacherFilter] }>();

function update(patch: Partial<TeacherFilter>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

const disciplineId = computed({
  get: () => props.modelValue.disciplineId,
  set: (value: string) => update({ disciplineId: value }),
});

const position = computed({
  get: () => props.modelValue.position,
  set: (value: string) => update({ position: value }),
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Фильтры</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Дисциплина
        </span>
        <Select v-model="disciplineId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHER_FILTER_ALL">Все</SelectItem>
            <SelectItem
              v-for="discipline in disciplines"
              :key="discipline.id"
              :value="discipline.id"
            >
              {{ discipline.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Должность
        </span>
        <Select v-model="position">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHER_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="item in positions" :key="item" :value="item">{{ item }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>
