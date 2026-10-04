<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import {
  buildStudentGroupRows,
  buildStudentGroupStats,
  filterStudentGroupRows,
  STUDENT_GROUP_FILTER_ALL,
  type StudentGroupFilter,
} from '@/domain/student-group-view.ts';
import { useWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';
import {
  provideStudentGroupDialog,
  StudentGroupDialog,
} from '@/pages/student-groups/components/student-group-dialog';
import { StudentGroupFilters } from '@/pages/student-groups/components/student-group-filters';
import { StudentGroupSummary } from '@/pages/student-groups/components/student-group-summary';
import { StudentGroupTable } from '@/pages/student-groups/components/student-group-table';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

const studentGroupStore = useStudentGroupStore();
const disciplineStore = useDisciplineStore();
const teachingLoadStore = useTeachingLoadStore();

const studentGroupDialog = provideStudentGroupDialog();

const filters = ref<StudentGroupFilter>({
  disciplineId: STUDENT_GROUP_FILTER_ALL,
  courseYear: STUDENT_GROUP_FILTER_ALL,
});

/** Выбранные строки — визуальное состояние без массовых действий. */
const selected = ref<string[]>([]);

/** Порядок по названию с учётом цифр: «…2501», «…2502», а не «…2502», «…2501». */
const rows = computed(() =>
  buildStudentGroupRows(
    [...studentGroupStore.studentGroups].sort((left, right) =>
      left.name.localeCompare(right.name, 'ru', { numeric: true }),
    ),
    teachingLoadStore.loads,
    disciplineStore.disciplines,
  ),
);

const filteredRows = computed(() => filterStudentGroupRows(rows.value, filters.value));
const stats = computed(() => buildStudentGroupStats(filteredRows.value));

/** Курсы для фильтра — уникальные значения справочника по возрастанию. */
const courseYears = computed(() =>
  [
    ...new Set(
      studentGroupStore.studentGroups
        .map((group) => group.courseYear)
        .filter((year): year is number => year !== undefined),
    ),
  ]
    .sort((left, right) => left - right)
    .map(String),
);

function toggleRow(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

/** Выбор/снятие всех видимых (отфильтрованных) строк. */
function toggleAll(): void {
  const visible = filteredRows.value.map((row) => row.group.id);
  const allSelected = visible.every((id) => selected.value.includes(id));
  selected.value = allSelected
    ? selected.value.filter((id) => !visible.includes(id))
    : [...new Set([...selected.value, ...visible])];
}

/* Кнопка «Добавить группу» живёт в шапке — регистрируем обработчик. */
const workspaceAction = useWorkspaceAction();
onMounted(() => workspaceAction?.setHandler(() => studentGroupDialog.open({ kind: 'create' })));
onUnmounted(() => workspaceAction?.setHandler(null));
</script>

<template>
  <StudentGroupDialog />

  <div class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="flex w-[300px] shrink-0 flex-col gap-3">
      <StudentGroupFilters
        v-model="filters"
        :disciplines="disciplineStore.disciplines"
        :course-years="courseYears"
      />
      <StudentGroupSummary :stats="stats" />
    </div>

    <div class="min-w-0 flex-1">
      <StudentGroupTable
        :rows="filteredRows"
        :selected="selected"
        @toggle-row="toggleRow"
        @toggle-all="toggleAll"
        @edit="(id) => studentGroupDialog.open({ kind: 'edit', groupId: id })"
        @delete="(id) => studentGroupDialog.open({ kind: 'delete', groupId: id })"
      />
    </div>
  </div>
</template>
