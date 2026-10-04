<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Users } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { streamMergeError } from '@/domain/teaching-load-view.ts';
import { useWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';
import {
  TeachingLoadDialog,
  provideTeachingLoadDialog,
} from '@/pages/teaching-load/components/teaching-load-dialog';
import { TeachingLoadFilters } from '@/pages/teaching-load/components/teaching-load-filters';
import { TeachingLoadSummary } from '@/pages/teaching-load/components/teaching-load-summary';
import { TeachingLoadTable } from '@/pages/teaching-load/components/teaching-load-table';
import {
  StreamMergeDialog,
  provideStreamMergeDialog,
} from '@/pages/teaching-load/components/stream-merge-dialog';
import { useTeachingLoads } from '@/pages/teaching-load/useTeachingLoads.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';

const disciplineStore = useDisciplineStore();
const teacherStore = useTeacherStore();
const studentGroupStore = useStudentGroupStore();

const { filter, filteredRows, stats, referencedLoadIds } = useTeachingLoads();

const loadDialog = provideTeachingLoadDialog();
const mergeDialog = provideStreamMergeDialog();

/** Выбранные строки — основа слияния в поток. */
const selected = ref<string[]>([]);

const selectedRows = computed(() =>
  filteredRows.value.filter((row) => selected.value.includes(row.load.id)),
);

/** Причина, по которой выбранные строки нельзя объединить, или null. */
const mergeError = computed(() =>
  selectedRows.value.length >= 2 ? streamMergeError(selectedRows.value) : null,
);

function toggleRow(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

function toggleAll(): void {
  const visible = filteredRows.value.map((row) => row.load.id);
  const allSelected = visible.every((id) => selected.value.includes(id));
  selected.value = allSelected
    ? selected.value.filter((id) => !visible.includes(id))
    : [...new Set([...selected.value, ...visible])];
}

/** Открывает диалог слияния для выделенных строк. */
function openMerge(): void {
  if (mergeError.value) return;
  mergeDialog.open(selectedRows.value.map((row) => row.load.id));
}

/* Смена фильтра/состава прячет часть строк — снимаем с них выделение. */
watch(filteredRows, (rows) => {
  const visible = new Set(rows.map((row) => row.load.id));
  selected.value = selected.value.filter((id) => visible.has(id));
});

/* Кнопка «Добавить нагрузку» живёт в шапке — регистрируем обработчик. */
const workspaceAction = useWorkspaceAction();
onMounted(() => workspaceAction?.setHandler(() => loadDialog.open({ kind: 'create' })));
onUnmounted(() => workspaceAction?.setHandler(null));
</script>

<template>
  <TeachingLoadDialog />
  <StreamMergeDialog />

  <div class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="flex w-[300px] shrink-0 flex-col gap-3">
      <TeachingLoadFilters
        v-model="filter"
        :groups="studentGroupStore.studentGroups"
        :teachers="teacherStore.teachers"
        :disciplines="disciplineStore.disciplines"
      />
      <TeachingLoadSummary :stats="stats" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <!-- Действия над выделенными строками: слияние в поток (UC-5.1) -->
      <div
        v-if="selected.length"
        class="flex flex-wrap items-center gap-3 rounded-lg border bg-background px-3 py-2 shadow-sm"
      >
        <span class="text-sm text-muted-foreground">Выбрано: {{ selected.length }}</span>
        <Button
          variant="subtle"
          :disabled="selectedRows.length < 2 || mergeError !== null"
          @click="openMerge"
        >
          <Users :size="16" />
          Объединить в поток
        </Button>
        <span v-if="mergeError" class="text-xs text-destructive">{{ mergeError }}</span>
        <Button variant="ghost" class="ml-auto" @click="selected = []">Снять выделение</Button>
      </div>

      <TeachingLoadTable
        :rows="filteredRows"
        :selected="selected"
        :referenced-load-ids="referencedLoadIds"
        @toggle-row="toggleRow"
        @toggle-all="toggleAll"
        @edit="(id) => loadDialog.open({ kind: 'edit', loadId: id })"
        @delete="(id) => loadDialog.open({ kind: 'delete', loadId: id })"
        @split="(id) => loadDialog.open({ kind: 'split', loadId: id })"
      />
    </div>
  </div>
</template>
