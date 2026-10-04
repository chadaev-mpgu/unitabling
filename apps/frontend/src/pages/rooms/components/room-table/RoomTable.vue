<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Trash2 } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { formatCapacity, type Room } from '@/domain/room.ts';
import { ROOM_KIND_LABELS } from '@/pages/rooms/constants.ts';

interface Props {
  rows: Room[];
  selected: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle-row': [id: string];
  'toggle-all': [];
  edit: [id: string];
  delete: [id: string];
}>();

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((row) => props.selected.includes(row.id)),
);
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-background shadow-sm">
    <table class="w-full border-collapse text-sm" data-slot="room-table">
      <thead>
        <tr class="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
          <th class="w-12 px-4 py-3">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="allSelected"
              aria-label="Выбрать всех"
              @change="emit('toggle-all')"
            />
          </th>
          <th class="px-4 py-3 text-center font-medium">Название</th>
          <th class="px-4 py-3 text-center font-medium">Тип</th>
          <th class="px-4 py-3 text-center font-medium">Вместимость</th>
          <th class="w-32 px-4 py-3 text-center font-medium">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-b transition-colors last:border-0 hover:bg-muted/40"
        >
          <td class="px-4 py-2">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="selected.includes(row.id)"
              :aria-label="`Выбрать ${row.name}`"
              @change="emit('toggle-row', row.id)"
            />
          </td>
          <td class="px-4 py-2 text-center">{{ row.name }}</td>
          <td class="px-4 py-2 text-center text-muted-foreground">
            {{ ROOM_KIND_LABELS[row.kind] }}
          </td>
          <td class="px-4 py-2 text-center tabular-nums">{{ formatCapacity(row.capacity) }}</td>
          <td class="px-4 py-2">
            <div class="flex items-center justify-center gap-2">
              <Button
                variant="subtle"
                class="size-8 p-0"
                :aria-label="`Изменить ${row.name}`"
                @click="emit('edit', row.id)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="destructive"
                class="size-8 p-0"
                :aria-label="`Удалить ${row.name}`"
                @click="emit('delete', row.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">
            Аудитории не найдены
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
