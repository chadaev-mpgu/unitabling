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
import type { StudentGroup } from '@/domain/student-group.ts';
import type { Teacher } from '@/domain/teacher.ts';
import { TEACHING_LOAD_FILTER_ALL, type TeachingLoadFilter } from '@/domain/teaching-load-view.ts';
import {
  TEACHING_LOAD_TYPE_LABELS,
  TEACHING_LOAD_TYPE_OPTIONS,
} from '@/pages/teaching-load/constants.ts';

interface Props {
  modelValue: TeachingLoadFilter;
  groups: StudentGroup[];
  teachers: Teacher[];
  disciplines: Discipline[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: TeachingLoadFilter] }>();

function update(patch: Partial<TeachingLoadFilter>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

const groupId = computed({
  get: () => props.modelValue.groupId,
  set: (value: string) => update({ groupId: value }),
});

const teacherId = computed({
  get: () => props.modelValue.teacherId,
  set: (value: string) => update({ teacherId: value }),
});

const disciplineId = computed({
  get: () => props.modelValue.disciplineId,
  set: (value: string) => update({ disciplineId: value }),
});

const lessonType = computed({
  get: () => props.modelValue.lessonType,
  set: (value: string) => update({ lessonType: value }),
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
          Группа
        </span>
        <Select v-model="groupId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHING_LOAD_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Преподаватель
        </span>
        <Select v-model="teacherId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHING_LOAD_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.fullName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Дисциплина
        </span>
        <Select v-model="disciplineId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHING_LOAD_FILTER_ALL">Все</SelectItem>
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
          Вид занятия
        </span>
        <Select v-model="lessonType">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="TEACHING_LOAD_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="type in TEACHING_LOAD_TYPE_OPTIONS" :key="type" :value="type">
              {{ TEACHING_LOAD_TYPE_LABELS[type] }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>
