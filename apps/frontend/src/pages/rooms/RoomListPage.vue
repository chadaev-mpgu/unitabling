<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import {
  buildRoomStats,
  filterRooms,
  ROOM_FILTER_ALL,
  type RoomFilter,
} from '@/domain/room-view.ts';
import { useWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';
import { RoomDialog, provideRoomDialog } from '@/pages/rooms/components/room-dialog';
import { RoomFilters } from '@/pages/rooms/components/room-filters';
import { RoomSummary } from '@/pages/rooms/components/room-summary';
import { RoomTable } from '@/pages/rooms/components/room-table';
import { useRoomStore } from '@/stores/global/room.ts';

const roomStore = useRoomStore();

const roomDialog = provideRoomDialog();

const filters = ref<RoomFilter>({
  kind: ROOM_FILTER_ALL,
  capacity: ROOM_FILTER_ALL,
});

/** Выбранные строки — визуальное состояние без массовых действий. */
const selected = ref<string[]>([]);

/** Числовая сортировка по названию: «101», «102», «305», а не «101», «102», «20». */
const rows = computed(() =>
  [...roomStore.rooms].sort((left, right) =>
    left.name.localeCompare(right.name, 'ru', { numeric: true }),
  ),
);

const filteredRows = computed(() => filterRooms(rows.value, filters.value));
const stats = computed(() => buildRoomStats(filteredRows.value));

function toggleRow(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

/** Выбор/снятие всех видимых (отфильтрованных) строк. */
function toggleAll(): void {
  const visible = filteredRows.value.map((room) => room.id);
  const allSelected = visible.every((id) => selected.value.includes(id));
  selected.value = allSelected
    ? selected.value.filter((id) => !visible.includes(id))
    : [...new Set([...selected.value, ...visible])];
}

/* Кнопка «Добавить аудиторию» живёт в шапке — регистрируем обработчик. */
const workspaceAction = useWorkspaceAction();
onMounted(() => workspaceAction?.setHandler(() => roomDialog.open({ kind: 'create' })));
onUnmounted(() => workspaceAction?.setHandler(null));
</script>

<template>
  <RoomDialog />

  <div class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="flex w-[300px] shrink-0 flex-col gap-3">
      <RoomFilters v-model="filters" />
      <RoomSummary :stats="stats" />
    </div>

    <div class="min-w-0 flex-1">
      <RoomTable
        :rows="filteredRows"
        :selected="selected"
        @toggle-row="toggleRow"
        @toggle-all="toggleAll"
        @edit="(id) => roomDialog.open({ kind: 'edit', roomId: id })"
        @delete="(id) => roomDialog.open({ kind: 'delete', roomId: id })"
      />
    </div>
  </div>
</template>
