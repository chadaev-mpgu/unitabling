<script setup lang="ts">
import { ref } from 'vue';
import { CalendarDays, Plus, X } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { holidayRangeLabel, type HolidayRange } from '@/domain/academic-calendar-view.ts';

interface PatternOption {
  id: string;
  name: string;
}

interface Props {
  name: string;
  startDate: string;
  weeks: number;
  defaultPatternId: string;
  patternOptions: PatternOption[];
  holidays: HolidayRange[];
  holidayError: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:name': [value: string];
  'update:start-date': [value: string];
  'update:weeks': [value: number];
  'update:default-pattern': [value: string];
  'add:holiday-range': [from: string, to: string];
  'remove:holiday': [dates: string[]];
  close: [];
}>();

/** Поля добавления каникул: «с» и «по»; пустая вторая дата = один день. */
const holidayFrom = ref('');
const holidayTo = ref('');

function addHoliday(): void {
  const from = holidayFrom.value;
  const to = holidayTo.value || holidayFrom.value;
  if (!from) return;
  emit('add:holiday-range', from, to);
  holidayFrom.value = '';
  holidayTo.value = '';
}

/** Пустое поле не должно сбрасывать число недель в ноль. */
function updateWeeks(value: string | number): void {
  if (String(value) === '') return;
  emit('update:weeks', Number(value));
}
</script>

<template>
  <Card data-slot="academic-calendar-settings-panel" class="gap-3">
    <CardHeader>
      <CardTitle>Изменить календарь</CardTitle>
      <Button
        variant="ghost"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Закрыть настройки календаря"
        @click="emit('close')"
      >
        <X class="size-4" />
      </Button>
    </CardHeader>

    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Название</Label>
        <Input
          :model-value="props.name"
          placeholder="Например, 2026/2027-осень-ОФО"
          @update:model-value="(value) => emit('update:name', String(value))"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Дата начала</Label>
        <Input
          :model-value="props.startDate"
          type="date"
          aria-label="Дата начала первой недели"
          @update:model-value="(value) => emit('update:start-date', String(value))"
        />
        <p class="text-[11px] text-muted-foreground">
          Первая неделя начинается с понедельника — от него отсчитываются недели.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">
          Количество недель
        </Label>
        <Input
          :model-value="props.weeks"
          type="number"
          min="1"
          aria-label="Число недель в календаре"
          @update:model-value="updateWeeks"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">
          Шаблон недели по умолчанию
        </Label>
        <Select
          :model-value="props.defaultPatternId"
          @update:model-value="(value) => emit('update:default-pattern', String(value))"
        >
          <SelectTrigger class="w-full" aria-label="Шаблон недели по умолчанию">
            <SelectValue placeholder="Выберите шаблон" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in props.patternOptions" :key="option.id" :value="option.id">
              {{ option.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Дни каникул</Label>

        <div
          v-for="range in props.holidays"
          :key="range.from"
          data-slot="academic-calendar-holiday"
          class="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2"
        >
          <CalendarDays class="size-4 shrink-0 text-muted-foreground" />
          <span class="min-w-0 flex-1 truncate text-sm">{{ holidayRangeLabel(range) }}</span>
          <Button
            variant="ghost"
            class="size-7 shrink-0 p-0"
            :aria-label="`Убрать каникулы ${holidayRangeLabel(range)}`"
            @click="emit('remove:holiday', range.dates)"
          >
            <X class="size-3.5" />
          </Button>
        </div>

        <p
          v-if="!props.holidays.length"
          class="rounded-md border border-dashed px-3 py-2 text-center text-xs text-muted-foreground"
        >
          Каникул нет
        </p>

        <div class="flex flex-col gap-2 rounded-md border p-2">
          <div class="grid grid-cols-2 gap-2">
            <Input v-model="holidayFrom" type="date" aria-label="Начало каникул" />
            <Input
              v-model="holidayTo"
              type="date"
              aria-label="Конец каникул"
              :min="holidayFrom || undefined"
            />
          </div>
          <Button variant="subtle" :disabled="!holidayFrom" @click="addHoliday">
            <Plus class="size-4" />
            Добавить каникулы
          </Button>
        </div>

        <p v-if="props.holidayError" class="text-xs text-destructive">{{ props.holidayError }}</p>
      </div>

      <p class="text-[11px] text-muted-foreground">
        На праздничные даты вхождений уроков не существует: часы возвращаются в нерасставленную
        нагрузку. Изменения применяются к текущему календарю после сохранения.
      </p>
    </CardContent>
  </Card>
</template>
