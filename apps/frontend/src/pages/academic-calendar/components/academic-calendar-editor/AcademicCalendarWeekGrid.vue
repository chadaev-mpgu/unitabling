<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { CalendarOff } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveColor } from '@/domain/color.ts';
import { weekRangeLabel, type CalendarWeekView } from '@/domain/academic-calendar-view.ts';

interface Props {
  weeks: CalendarWeekView[];
  selectedIndex: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ open: [index: number] }>();

/** Фон карточки: цвет выбранного шаблона; выбранная неделя — заливка цветом. */
function cardStyle(week: CalendarWeekView, selected: boolean): CSSProperties {
  if (!week.color) return {};
  const { background, foreground } = resolveColor(week.color);
  if (selected) return { backgroundColor: foreground, color: '#fff', borderColor: foreground };
  return { backgroundColor: background, color: foreground, borderColor: `${foreground}33` };
}

/** Подпись карточки для скринридера: номер, даты, шаблон, пометки. */
function weekLabel(week: CalendarWeekView): string {
  const parts = [week.patternName];
  if (week.isOverride) parts.push('заменённый шаблон');
  if (week.holidays.length > 0) parts.push(`каникулы: ${week.holidays.length}`);
  return `Неделя ${week.index}, ${weekRangeLabel(week.start, week.end)}. ${parts.join(', ')}`;
}
</script>

<template>
  <Card data-slot="academic-calendar-week-grid" class="gap-3">
    <CardHeader>
      <CardTitle>Недели календаря</CardTitle>
      <p class="col-start-2 row-start-1 self-center text-xs text-muted-foreground">
        Цвет — шаблон недели, нажмите на неделю, чтобы заменить
      </p>
    </CardHeader>

    <CardContent>
      <div v-if="props.weeks.length" class="grid grid-cols-6 gap-3">
        <Button
          v-for="week in props.weeks"
          :key="week.index"
          variant="ghost"
          data-slot="academic-calendar-week"
          class="relative flex h-[86px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-0 text-center font-normal"
          :class="week.index === props.selectedIndex ? 'ring-2 ring-primary/50' : 'hover:shadow-md'"
          :style="cardStyle(week, week.index === props.selectedIndex)"
          :aria-label="weekLabel(week)"
          :title="weekLabel(week)"
          @click="emit('open', week.index)"
        >
          <span
            v-if="week.isOverride"
            data-slot="academic-calendar-week-override"
            aria-hidden="true"
            class="absolute top-1.5 left-1.5 size-1.5 rounded-full bg-current"
          />
          <CalendarOff
            v-if="week.holidays.length > 0"
            aria-hidden="true"
            class="absolute top-1 right-1 size-3.5"
          />

          <span class="text-2xl leading-none font-bold">{{ week.index }}</span>
          <span class="text-[11px] leading-tight opacity-80">
            {{ weekRangeLabel(week.start, week.end) }}
          </span>
        </Button>
      </div>

      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        Укажите число недель, чтобы увидеть разметку
      </p>
    </CardContent>
  </Card>
</template>
