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
import { STUDENT_GROUP_FILTER_ALL, type StudentGroupFilter } from '@/domain/student-group-view.ts';

interface Props {
  modelValue: StudentGroupFilter;
  disciplines: Discipline[];
  courseYears: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: StudentGroupFilter] }>();

function update(patch: Partial<StudentGroupFilter>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

const disciplineId = computed({
  get: () => props.modelValue.disciplineId,
  set: (value: string) => update({ disciplineId: value }),
});

const courseYear = computed({
  get: () => props.modelValue.courseYear,
  set: (value: string) => update({ courseYear: value }),
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
            <SelectItem :value="STUDENT_GROUP_FILTER_ALL">Все</SelectItem>
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
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Курс</span>
        <Select v-model="courseYear">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="STUDENT_GROUP_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="year in courseYears" :key="year" :value="year">
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>
