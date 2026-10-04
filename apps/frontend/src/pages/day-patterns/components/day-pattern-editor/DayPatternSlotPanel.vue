<script setup lang="ts">
import { ref, watch } from 'vue';
import { X } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DayPatternItem } from '@/domain/day-pattern.ts';
import { formatTime, parseTime } from '@/domain/day-pattern-view.ts';

interface Props {
  item: DayPatternItem;
  issue: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ update: [patch: Partial<DayPatternItem>]; close: [] }>();

/*
 * Время вводится текстом «ЧЧ:ММ» в 24-часовом формате. Нативный
 * <input type="time"> показывает время по локали браузера и может дать
 * 12-часовой вид с AM/PM, поэтому используем обычное поле с нормализацией
 * значения по потере фокуса.
 */
const start = ref(props.item.start);
const end = ref(props.item.end);

/** Сброс полей при выборе другой пары: компонент переиспользуется. */
watch(
  () => props.item.index,
  () => {
    start.value = props.item.start;
    end.value = props.item.end;
  },
);

function onInput(key: 'start' | 'end', value: string | number): void {
  const next = String(value);
  if (key === 'start') start.value = next;
  else end.value = next;
}

/** По blur приводит корректное время к виду «ЧЧ:ММ»; иначе оставляет для проверки. */
function commit(key: 'start' | 'end', value: string): void {
  const parsed = parseTime(value);
  const next = parsed === null ? value.trim() : formatTime(parsed);
  emit('update', { [key]: next });
  if (key === 'start') start.value = next;
  else end.value = next;
}
</script>

<template>
  <Card data-slot="day-pattern-slot-panel" class="gap-3">
    <CardHeader>
      <CardTitle>Изменить занятие</CardTitle>
      <Button
        variant="ghost"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Закрыть панель пары"
        @click="emit('close')"
      >
        <X class="size-4" />
      </Button>
    </CardHeader>

    <CardContent class="flex flex-col gap-3">
      <div
        class="flex flex-col gap-0.5 rounded-md border border-primary/30 bg-primary-subtle px-3 py-2"
      >
        <span class="text-[10px] font-medium tracking-wide text-primary uppercase">Выбрано</span>
        <span class="text-sm font-semibold">Занятие №{{ props.item.index }}</span>
        <span class="text-xs text-muted-foreground">
          {{ props.item.start }} – {{ props.item.end }}
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Индекс</Label>
        <Input :model-value="props.item.index" disabled class="bg-muted" />
        <p class="text-[11px] text-muted-foreground">
          Номера пар идут по порядку времени; изменить номер нельзя.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <Label class="text-xs tracking-wide text-muted-foreground uppercase">Время начала</Label>
          <Input
            :model-value="start"
            placeholder="08:30"
            inputmode="numeric"
            maxlength="5"
            :aria-label="`Время начала пары №${props.item.index}`"
            @update:model-value="(value) => onInput('start', value)"
            @blur="commit('start', start)"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-xs tracking-wide text-muted-foreground uppercase"
            >Время окончания</Label
          >
          <Input
            :model-value="end"
            placeholder="10:00"
            inputmode="numeric"
            maxlength="5"
            :aria-label="`Время окончания пары №${props.item.index}`"
            @update:model-value="(value) => onInput('end', value)"
            @blur="commit('end', end)"
          />
        </div>
      </div>

      <p class="text-[11px] text-muted-foreground">24-часовой формат: ЧЧ:ММ, например 08:30.</p>

      <p v-if="issue" class="text-xs text-destructive">{{ issue }}</p>

      <p class="text-[11px] text-muted-foreground">
        Изменения применяются к выбранной строке занятия в таблице. Сохраните шаблон, чтобы записать
        их.
      </p>
    </CardContent>
  </Card>
</template>
