<script setup lang="ts">
import { computed } from 'vue';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS, Weekday } from '@/domain/week.ts';
import { WEEK_PATTERN_WEEKDAYS, type WeekPatternDay } from '@/domain/week-pattern.ts';
import type { WeekPatternIssue } from '@/domain/week-pattern-view.ts';
import { WEEK_PATTERN_DAY_OFF } from '@/pages/week-patterns/constants.ts';
import type { DayPatternOptionItem } from '@/pages/week-patterns/useWeekPatternEditor.ts';

interface Props {
  days: WeekPatternDay[];
  options: DayPatternOptionItem[];
  issues: WeekPatternIssue[];
}

interface TableRow {
  weekday: Weekday;
  templateId: string | null;
  issue: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update-day': [weekday: Weekday, templateId: string | null] }>();

/** Значение выбора: null кодируется отдельным пунктом «(Выходной)». */
const selectValue = (templateId: string | null): string => templateId ?? WEEK_PATTERN_DAY_OFF;

/** Ссылка на отсутствующий в справочнике шаблон остаётся видимой в выборе. */
const options = computed<DayPatternOptionItem[]>(() => {
  const known = new Set(props.options.map((option) => option.id));
  const missing = props.days
    .map((day) => day.templateId)
    .filter((id): id is string => id !== null && !known.has(id));
  return [
    ...props.options,
    ...[...new Set(missing)].map((id) => ({ id, name: 'Шаблон недоступен' })),
  ];
});

const rows = computed<TableRow[]>(() => {
  const issuesByWeekday = new Map<Weekday, string>();
  for (const issue of props.issues) {
    if (issue.weekday !== null && !issuesByWeekday.has(issue.weekday)) {
      issuesByWeekday.set(issue.weekday, issue.message);
    }
  }
  return WEEK_PATTERN_WEEKDAYS.map((weekday) => ({
    weekday,
    templateId: props.days.find((day) => day.weekday === weekday)?.templateId ?? null,
    issue: issuesByWeekday.get(weekday) ?? null,
  }));
});

function updateDay(weekday: Weekday, value: unknown): void {
  const next = String(value);
  emit('update-day', weekday, next === WEEK_PATTERN_DAY_OFF ? null : next);
}
</script>

<template>
  <Card data-slot="week-pattern-table" class="gap-0 overflow-hidden p-0">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
          <th class="w-40 px-4 py-3 text-center font-medium">День недели</th>
          <th class="px-4 py-3 text-center font-medium">Шаблон учебного дня</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="row in rows" :key="row.weekday">
          <tr
            class="border-b transition-colors"
            :class="row.issue ? 'bg-destructive-subtle/50' : 'hover:bg-muted/40'"
          >
            <td class="px-4 py-3 text-center">
              <span
                class="text-lg font-semibold text-primary"
                :title="WEEKDAY_LABELS[row.weekday]"
                :aria-label="WEEKDAY_LABELS[row.weekday]"
              >
                {{ WEEKDAY_SHORT_LABELS[row.weekday] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-center">
                <Select
                  :model-value="selectValue(row.templateId)"
                  @update:model-value="(value) => updateDay(row.weekday, value)"
                >
                  <SelectTrigger
                    class="w-[240px]"
                    :aria-label="`Шаблон для ${WEEKDAY_LABELS[row.weekday]}`"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in options"
                      :key="option.id ?? WEEK_PATTERN_DAY_OFF"
                      :value="selectValue(option.id)"
                    >
                      {{ option.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </td>
          </tr>

          <tr v-if="row.issue" class="border-b bg-destructive-subtle/50">
            <td colspan="2" class="px-4 py-1 text-xs text-destructive">
              {{ WEEKDAY_SHORT_LABELS[row.weekday] }}: {{ row.issue }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </Card>
</template>
