<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { RotateCcw, Save, TriangleAlert } from '@lucide/vue';

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
import type { AcademicCalendar } from '@/domain/academic-calendar.ts';
import { cn } from '@/lib/utils.ts';
import type { DashboardPeriodInfo } from '@/pages/dashboard/types.ts';

interface Props {
  hasProject: boolean;
  name: string;
  calendarId: string;
  calendars: AcademicCalendar[];
  /** Период календаря проекта — read-only сведения. */
  period: DashboardPeriodInfo;
  isDirty: boolean;
  /** Черновик ссылается на другой календарь — сетка проекта перестроится. */
  willChangeCalendar: boolean;
  canSave: boolean;
  saving: boolean;
  justSaved: boolean;
  error: string | null;
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:calendarId': [value: string];
  save: [];
  reset: [];
}>();

/** Select отдаёт широкий тип значения — берём только id календаря. */
function onCalendarChange(value: unknown): void {
  if (typeof value === 'string') emit('update:calendarId', value);
}
</script>

<template>
  <Card data-slot="dashboard-project-settings" :class="cn('gap-3', props.class)">
    <CardHeader>
      <CardTitle>Текущий проект</CardTitle>
      <span
        v-if="isDirty"
        data-slot="dashboard-project-settings-unsaved"
        class="col-start-2 row-start-1 justify-self-end rounded-full bg-attention-subtle px-2 py-0.5 text-[10px] font-medium text-attention"
      >
        Не сохранено
      </span>
      <span
        v-else-if="justSaved"
        data-slot="dashboard-project-settings-saved"
        class="col-start-2 row-start-1 justify-self-end rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-medium text-primary"
      >
        Сохранено
      </span>
    </CardHeader>

    <CardContent v-if="hasProject" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="dashboard-project-name">Название</Label>
        <Input
          id="dashboard-project-name"
          data-slot="dashboard-project-settings-name"
          :model-value="name"
          placeholder="ИФТИС-2-осень-2026"
          @update:model-value="(value) => emit('update:name', String(value))"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>Академический календарь</Label>
        <Select :model-value="calendarId" @update:model-value="onCalendarChange">
          <SelectTrigger
            data-slot="dashboard-project-settings-calendar"
            class="w-full"
            aria-label="Академический календарь"
          >
            <SelectValue placeholder="Выберите календарь" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="calendar in calendars" :key="calendar.id" :value="calendar.id">
              {{ calendar.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p
          v-if="willChangeCalendar"
          data-slot="dashboard-project-settings-calendar-warning"
          class="flex items-start gap-1.5 text-xs text-attention"
        >
          <TriangleAlert class="mt-0.5 size-3.5 shrink-0" />
          Календарь задаёт сетку времени проекта: после сохранения расписание пересчитается по
          новому календарю.
        </p>
      </div>

      <dl class="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-muted/50 px-3 py-2.5 text-sm">
        <div class="col-span-2 flex flex-col">
          <dt class="text-xs text-muted-foreground">Период</dt>
          <dd data-slot="dashboard-project-settings-period">
            {{ period.start }} — {{ period.end }}
          </dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-xs text-muted-foreground">Недель</dt>
          <dd class="tabular-nums">{{ period.weeks }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-xs text-muted-foreground">Текущая неделя</dt>
          <dd data-slot="dashboard-project-settings-current-week" class="tabular-nums">
            {{ period.currentWeek ?? 'вне календаря' }}
          </dd>
        </div>
      </dl>

      <p v-if="error" data-slot="dashboard-project-settings-error" class="text-sm text-destructive">
        {{ error }}
      </p>

      <div class="flex items-center gap-2">
        <Button
          data-slot="dashboard-project-settings-reset"
          variant="subtle"
          :disabled="!isDirty || saving"
          @click="emit('reset')"
        >
          <RotateCcw class="size-4" />
          Сбросить
        </Button>
        <Button
          data-slot="dashboard-project-settings-save"
          :disabled="!canSave || saving"
          @click="emit('save')"
        >
          <Save class="size-4" />
          {{ saving ? 'Сохранение…' : 'Сохранить' }}
        </Button>
      </div>
    </CardContent>

    <CardContent v-else>
      <p class="py-2 text-sm text-muted-foreground">
        Проект не выбран. Создайте проект в шапке, чтобы настроить его параметры.
      </p>
    </CardContent>
  </Card>
</template>
