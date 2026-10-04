<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Trash2, Unlink } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { formatHoursWithUnit } from '@/domain/hours.ts';
import type { TeachingLoadRow } from '@/domain/teaching-load-view.ts';
import { TEACHING_LOAD_TYPE_LABELS } from '@/pages/teaching-load/constants.ts';

interface Props {
  rows: TeachingLoadRow[];
  selected: string[];
  /** id строк с занятиями: удаление и разбор запрещены. */
  referencedLoadIds: Set<string>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle-row': [id: string];
  'toggle-all': [];
  edit: [id: string];
  delete: [id: string];
  split: [id: string];
}>();

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((row) => props.selected.includes(row.load.id)),
);

/** Поток без занятий можно разобрать (UC-5.5). */
function canSplit(row: TeachingLoadRow): boolean {
  return row.isStream && !props.referencedLoadIds.has(row.load.id);
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-background shadow-sm">
    <table class="w-full border-collapse text-sm" data-slot="teaching-load-table">
      <thead>
        <tr class="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
          <th class="w-12 px-4 py-3">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="allSelected"
              aria-label="Выбрать все"
              @change="emit('toggle-all')"
            />
          </th>
          <th class="px-4 py-3 text-center font-medium">Дисциплина</th>
          <th class="px-4 py-3 text-center font-medium">Вид занятия</th>
          <th class="px-4 py-3 text-center font-medium">Преподаватель</th>
          <th class="px-4 py-3 text-center font-medium">Группа</th>
          <th class="px-4 py-3 text-center font-medium">Кол-во часов</th>
          <th class="w-40 px-4 py-3 text-center font-medium">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.load.id"
          class="border-b transition-colors last:border-0 hover:bg-muted/40"
        >
          <td class="px-4 py-2">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="selected.includes(row.load.id)"
              :aria-label="`Выбрать ${row.discipline}`"
              @change="emit('toggle-row', row.load.id)"
            />
          </td>
          <td class="px-4 py-2 text-center">{{ row.discipline }}</td>
          <td class="px-4 py-2 text-center">
            {{ TEACHING_LOAD_TYPE_LABELS[row.load.lessonType] }}
          </td>
          <td class="px-4 py-2 text-center text-muted-foreground">
            {{ row.teacher ?? '—' }}
          </td>

          <!-- Поток: внутренний блок со списком групп и пометкой «поток» (UC-3.2) -->
          <td class="px-4 py-2">
            <div
              v-if="row.isStream"
              data-slot="teaching-load-stream"
              class="mx-auto flex w-fit max-w-[220px] flex-col gap-1 rounded-md border border-border/70 bg-muted/60 px-2.5 py-1.5 text-left"
            >
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="name in row.groupNames"
                  :key="name"
                  class="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                >
                  {{ name }}
                </span>
              </div>
              <span class="text-xs font-medium text-muted-foreground">поток</span>
            </div>
            <span v-else class="block text-center">{{ row.groupNames[0] }}</span>
          </td>

          <td class="px-4 py-2 text-center tabular-nums">
            <span class="block">{{ formatHoursWithUnit(row.load.hoursTotal) }}</span>
            <span class="block text-xs text-muted-foreground">
              осталось {{ formatHoursWithUnit(row.hours.remaining) }}
            </span>
          </td>

          <td class="px-4 py-2">
            <div class="flex items-center justify-center gap-2">
              <Button
                variant="subtle"
                class="size-8 p-0"
                :aria-label="`Изменить ${row.discipline}`"
                @click="emit('edit', row.load.id)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="destructive"
                class="size-8 p-0"
                :aria-label="`Удалить ${row.discipline}`"
                @click="emit('delete', row.load.id)"
              >
                <Trash2 class="size-4" />
              </Button>
              <Button
                v-if="row.isStream"
                variant="subtle"
                class="size-8 p-0"
                :disabled="!canSplit(row)"
                :title="
                  referencedLoadIds.has(row.load.id)
                    ? 'Поток с занятиями разобрать нельзя'
                    : 'Разобрать поток'
                "
                :aria-label="`Разобрать поток ${row.discipline}`"
                @click="emit('split', row.load.id)"
              >
                <Unlink class="size-4" />
              </Button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">
            Строки нагрузки не найдены
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
