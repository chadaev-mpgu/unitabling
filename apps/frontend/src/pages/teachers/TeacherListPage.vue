<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import {
  buildTeacherRows,
  buildTeacherStats,
  filterTeacherRows,
  TEACHER_FILTER_ALL,
  type TeacherFilter,
} from '@/domain/teacher-view.ts';
import { useWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';
import { TeacherDialog, provideTeacherDialog } from '@/pages/teachers/components/teacher-dialog';
import { TeacherFilters } from '@/pages/teachers/components/teacher-filters';
import { TeacherSummary } from '@/pages/teachers/components/teacher-summary';
import { TeacherTable } from '@/pages/teachers/components/teacher-table';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

const teacherStore = useTeacherStore();
const disciplineStore = useDisciplineStore();
const teachingLoadStore = useTeachingLoadStore();

const teacherDialog = provideTeacherDialog();

const filters = ref<TeacherFilter>({
  disciplineId: TEACHER_FILTER_ALL,
  position: TEACHER_FILTER_ALL,
});

/** Выбранные строки — визуальное состояние без массовых действий. */
const selected = ref<string[]>([]);

const rows = computed(() =>
  buildTeacherRows(
    [...teacherStore.teachers].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, 'ru'),
    ),
    teachingLoadStore.loads,
    disciplineStore.disciplines,
  ),
);

const filteredRows = computed(() => filterTeacherRows(rows.value, filters.value));
const stats = computed(() => buildTeacherStats(filteredRows.value));

/** Должности для фильтра — уникальные значения справочника. */
const positions = computed(() =>
  [
    ...new Set(
      teacherStore.teachers
        .map((teacher) => teacher.position)
        .filter((position): position is string => Boolean(position)),
    ),
  ].sort((left, right) => left.localeCompare(right, 'ru')),
);

function toggleRow(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

/** Выбор/снятие всех видимых (отфильтрованных) строк. */
function toggleAll(): void {
  const visible = filteredRows.value.map((row) => row.teacher.id);
  const allSelected = visible.every((id) => selected.value.includes(id));
  selected.value = allSelected
    ? selected.value.filter((id) => !visible.includes(id))
    : [...new Set([...selected.value, ...visible])];
}

/* Кнопка «Добавить преподавателя» живёт в шапке — регистрируем обработчик. */
const workspaceAction = useWorkspaceAction();
onMounted(() => workspaceAction?.setHandler(() => teacherDialog.open({ kind: 'create' })));
onUnmounted(() => workspaceAction?.setHandler(null));
</script>

<template>
  <TeacherDialog />

  <div class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="flex w-[300px] shrink-0 flex-col gap-3">
      <TeacherFilters
        v-model="filters"
        :disciplines="disciplineStore.disciplines"
        :positions="positions"
      />
      <TeacherSummary :stats="stats" />
    </div>

    <div class="min-w-0 flex-1">
      <TeacherTable
        :rows="filteredRows"
        :selected="selected"
        @toggle-row="toggleRow"
        @toggle-all="toggleAll"
        @edit="(id) => teacherDialog.open({ kind: 'edit', teacherId: id })"
        @delete="(id) => teacherDialog.open({ kind: 'delete', teacherId: id })"
      />
    </div>
  </div>
</template>
