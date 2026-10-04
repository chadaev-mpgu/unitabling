<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Trash2 } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { formatHoursWithUnit } from '@/domain/hours.ts';
import type { TeacherRow } from '@/domain/teacher-view.ts';

interface Props {
  rows: TeacherRow[];
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
  () => props.rows.length > 0 && props.rows.every((row) => props.selected.includes(row.teacher.id)),
);
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-background shadow-sm">
    <table class="w-full border-collapse text-sm" data-slot="teacher-table">
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
          <th class="px-4 py-3 text-center font-medium">Ф. И. О.</th>
          <th class="px-4 py-3 text-center font-medium">Дисциплины</th>
          <th class="px-4 py-3 text-center font-medium">Нагрузка</th>
          <th class="w-32 px-4 py-3 text-center font-medium">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.teacher.id"
          class="border-b transition-colors last:border-0 hover:bg-muted/40"
        >
          <td class="px-4 py-2">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="selected.includes(row.teacher.id)"
              :aria-label="`Выбрать ${row.teacher.fullName}`"
              @change="emit('toggle-row', row.teacher.id)"
            />
          </td>
          <td class="px-4 py-2 text-center">{{ row.teacher.fullName }}</td>
          <td class="px-4 py-2 text-center text-muted-foreground">
            {{ row.disciplineNames.join(', ') || '—' }}
          </td>
          <td class="px-4 py-2 text-center tabular-nums">
            {{ formatHoursWithUnit(row.hours) }}
          </td>
          <td class="px-4 py-2">
            <div class="flex items-center justify-center gap-2">
              <Button
                variant="subtle"
                class="size-8 p-0"
                :aria-label="`Изменить ${row.teacher.fullName}`"
                @click="emit('edit', row.teacher.id)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="destructive"
                class="size-8 p-0"
                :aria-label="`Удалить ${row.teacher.fullName}`"
                @click="emit('delete', row.teacher.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">
            Преподаватели не найдены
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
