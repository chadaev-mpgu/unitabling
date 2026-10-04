<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Plus, Trash2 } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DayPatternItem } from '@/domain/day-pattern.ts';
import { breakMinutes, formatDuration, type DayPatternIssue } from '@/domain/day-pattern-view.ts';

interface Props {
  items: DayPatternItem[];
  issues: DayPatternIssue[];
  selectedPosition: number | null;
}

interface TableRow {
  position: number;
  item: DayPatternItem;
  /** Ошибка пары, если есть. */
  issue: string | null;
  /** Пауза после пары до следующей; null — последняя пара или время некорректно. */
  gap: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  select: [position: number];
  edit: [position: number];
  remove: [position: number];
  add: [];
}>();

const rows = computed<TableRow[]>(() => {
  const issuesByIndex = new Map<number, string>();
  for (const issue of props.issues) {
    if (issue.itemIndex !== null && !issuesByIndex.has(issue.itemIndex)) {
      issuesByIndex.set(issue.itemIndex, issue.message);
    }
  }

  return props.items.map((item, position) => {
    const next = props.items[position + 1];
    return {
      position,
      item,
      issue: issuesByIndex.get(position + 1) ?? null,
      gap: next ? breakMinutes(item, next) : null,
    };
  });
});
</script>

<template>
  <Card data-slot="day-pattern-table" class="gap-0 overflow-hidden p-0">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
          <th class="w-24 px-4 py-3 text-center font-medium">Индекс</th>
          <th class="px-4 py-3 text-center font-medium">Время начала</th>
          <th class="px-4 py-3 text-center font-medium">Время окончания</th>
          <th class="w-32 px-4 py-3 text-center font-medium">Действия</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="row in rows" :key="row.item.index">
          <tr
            class="cursor-pointer border-b transition-colors"
            :class="
              row.position === selectedPosition
                ? 'bg-primary-subtle'
                : row.issue
                  ? 'bg-destructive-subtle/50 hover:bg-destructive-subtle'
                  : 'hover:bg-muted/40'
            "
            @click="emit('select', row.position)"
          >
            <td class="px-4 py-3 text-center">
              <span class="text-lg font-semibold tabular-nums text-primary">
                {{ row.item.index }}
              </span>
            </td>
            <td class="px-4 py-3 text-center tabular-nums">{{ row.item.start }}</td>
            <td class="px-4 py-3 text-center tabular-nums">{{ row.item.end }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                <Button
                  variant="subtle"
                  class="size-8 p-0"
                  :aria-label="`Изменить пару №${row.item.index}`"
                  @click.stop="emit('edit', row.position)"
                >
                  <Pencil class="size-4" />
                </Button>
                <Button
                  variant="destructive"
                  class="size-8 p-0"
                  :aria-label="`Удалить пару №${row.item.index}`"
                  @click.stop="emit('remove', row.position)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </td>
          </tr>

          <tr v-if="row.issue" class="border-b bg-destructive-subtle/50">
            <td colspan="4" class="px-4 py-1 text-xs text-destructive">
              Пара №{{ row.item.index }}: {{ row.issue }}
            </td>
          </tr>

          <tr v-else-if="row.gap !== null" class="border-b bg-muted/40">
            <td colspan="4" class="px-4 py-1 text-center text-[11px] text-muted-foreground">
              <template v-if="row.gap > 0">Перерыв {{ formatDuration(row.gap) }}</template>
              <span v-else class="text-destructive">Пары пересекаются по времени</span>
            </td>
          </tr>
        </template>

        <tr v-if="!rows.length">
          <td colspan="4" class="px-4 py-10 text-center text-sm text-muted-foreground">
            В шаблоне нет пар
          </td>
        </tr>
      </tbody>
    </table>

    <div class="p-4">
      <Button class="w-full" data-slot="day-pattern-add-item" @click="emit('add')">
        <Plus class="size-4" />
        Добавить занятие
      </Button>
    </div>
  </Card>
</template>
