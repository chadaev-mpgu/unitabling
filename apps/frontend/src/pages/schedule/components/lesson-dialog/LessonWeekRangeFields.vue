<script setup lang="ts">
import { CalendarDays } from '@lucide/vue';
import { useFormContext } from 'vee-validate';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { WeekPicker } from '@/components/week';

import type { CalendarWeek } from '@/domain/academic-calendar.ts';

import type { LessonFormValues } from './types.ts';

interface Props {
  weeks: CalendarWeek[];
  /** Exam/Credit ставится ровно на одну неделю. */
  singleWeek: boolean;
  /** Всего недель в календаре — для сброса на «весь семестр». */
  weekCount: number;
  /** Первая неделя, которую ещё можно назначить: прошедшие отрезаются. */
  minWeek: number;
}

const props = defineProps<Props>();

const { values, setFieldValue, setValues } = useFormContext<LessonFormValues>();

/** Границы диапазона не разъезжаются: «по» не раньше «с» и наоборот. */
function setWeekFrom(setValue: (value: number) => void, week: number) {
  setValue(week);
  if (props.singleWeek || week > values.weekTo) setFieldValue('weekTo', week);
}

function setWeekTo(setValue: (value: number) => void, week: number) {
  setValue(week);
  if (week < values.weekFrom) setFieldValue('weekFrom', week);
}

function resetWeekRange() {
  setValues({ weekFrom: props.minWeek, weekTo: props.weekCount });
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ value, setValue }" name="weekFrom">
        <FormItem>
          <FormLabel>{{ singleWeek ? 'Неделя' : 'Недели с' }}</FormLabel>
          <WeekPicker
            :model-value="value ?? null"
            :weeks="weeks"
            @update:model-value="setWeekFrom(setValue, $event)"
          >
            <template #trigger>
              <Button type="button" variant="secondary" class="w-full justify-start gap-2">
                <CalendarDays class="size-4 shrink-0" />
                {{ value ? `Неделя ${value}` : 'Выберите неделю' }}
              </Button>
            </template>
          </WeekPicker>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-if="!singleWeek" v-slot="{ value, setValue }" name="weekTo">
        <FormItem>
          <FormLabel>Недели по</FormLabel>
          <WeekPicker
            :model-value="value ?? null"
            :weeks="weeks"
            @update:model-value="setWeekTo(setValue, $event)"
          >
            <template #trigger>
              <Button type="button" variant="secondary" class="w-full justify-start gap-2">
                <CalendarDays class="size-4 shrink-0" />
                {{ value ? `Неделя ${value}` : 'Выберите неделю' }}
              </Button>
            </template>
          </WeekPicker>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <p class="text-sm text-muted-foreground">
      {{
        singleWeek
          ? 'Экзамен и зачёт ставятся ровно на одну неделю.'
          : 'По умолчанию занятие идёт все недели периода.'
      }}
      <button
        v-if="!singleWeek"
        type="button"
        class="underline underline-offset-2 hover:text-foreground"
        @click="resetWeekRange"
      >
        Весь семестр
      </button>
    </p>
  </div>
</template>
