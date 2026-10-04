<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeekParity } from '@/domain/week.ts';
import { cn } from '@/lib/utils.ts';

import { LESSON_TYPE_LABELS } from './constants.ts';
import LessonDraftPreview from './LessonDraftPreview.vue';
import LessonGroupsField from './LessonGroupsField.vue';
import LessonParityField from './LessonParityField.vue';
import LessonWeekRangeFields from './LessonWeekRangeFields.vue';
import { lessonSchema } from './schema.ts';
import type { LessonFormValues } from './types.ts';
import { useLessonDialog } from './useLessonDialog.ts';
import { useLessonDraftAnalysis } from './useLessonDraftAnalysis.ts';

interface Props {
  /** Сколько пар в шаблоне дня — проверка доступности слота (SlotUnavailable). */
  slotCount: number;
}

const props = defineProps<Props>();

const session = useLessonDialog();
const {
  isOpen,
  isEdit,
  day,
  slot,
  load,
  discipline,
  groups,
  rooms,
  teachers,
  weeks,
  isSingleWeek,
  allowedParities,
  canDelete,
  submitError,
} = session;

const form = useForm<LessonFormValues>({ validationSchema: lessonSchema });

/** Подтверждение удаления: кнопка «Удалить» превращается в пару «Отмена / Удалить». */
const isConfirmingDelete = ref(false);

/* При открытии форма сбрасывается под контекст: дроп нагрузки или клик по уроку. */
watch(isOpen, (open) => {
  if (open) {
    isConfirmingDelete.value = false;
    form.resetForm({ values: session.defaultValues.value });
  }
});

const {
  preview,
  errors,
  warnings,
  layoutError,
  rangeError,
  hasBlockingConflicts,
  occurrenceRangeLabel,
  weekRangeSummary,
} = useLessonDraftAnalysis(form, () => props.slotCount);

/** Первая назначаемая неделя для текущей парности: прошедшие недоступны. */
const minWeek = computed(() =>
  session.firstFutureWeekFor(session.isSingleWeek.value ? WeekParity.Both : form.values.parity),
);

const title = computed(() => (isEdit.value ? 'Занятие' : 'Новое занятие'));
const submitLabel = computed(() => (isEdit.value ? 'Сохранить' : 'Добавить занятие'));

const lessonTypeLabel = computed(() =>
  load.value ? LESSON_TYPE_LABELS[load.value.lessonType] : '',
);

const isStream = computed(() => groups.value.length > 1);

const onSubmit = form.handleSubmit(async (values) => {
  if (isConfirmingDelete.value || hasBlockingConflicts.value) return;
  await session.submit(values);
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="day && slot">
          {{ discipline?.name }} · {{ lessonTypeLabel }} · {{ day.label }}, {{ slot.number }}-я пара
          <template v-if="slot.times.length">({{ slot.times.join(', ') }})</template>
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="roomId">
          <FormItem>
            <FormLabel>Аудитория</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Выберите аудиторию" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="room in rooms" :key="room.id" :value="room.id">
                  {{ room.name }} · {{ room.capacity }} мест
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="teacherId">
          <FormItem>
            <FormLabel>Преподаватель</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Выберите преподавателя" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.fullName }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <LessonGroupsField :groups="groups" :is-stream="isStream" />

        <LessonParityField :single-week="isSingleWeek" :allowed="allowedParities" />

        <LessonWeekRangeFields
          :weeks="weeks"
          :single-week="isSingleWeek"
          :week-count="session.calendar.value.weeks"
          :min-week="minWeek"
        />

        <LessonDraftPreview
          v-if="preview"
          :occurrence-count="preview.occurrences.length"
          :occurrence-range-label="occurrenceRangeLabel"
          :week-range-summary="weekRangeSummary"
          :warnings="warnings"
          :errors="errors"
          :layout-error="layoutError"
          :range-error="rangeError"
        />

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter :class="cn(isConfirmingDelete && 'flex-col sm:flex-row')">
          <template v-if="isConfirmingDelete">
            <p class="text-sm text-muted-foreground sm:mr-auto">Удалить занятие?</p>
            <Button type="button" variant="subtle" @click="isConfirmingDelete = false">
              Отмена
            </Button>
            <Button type="button" variant="destructive" @click="session.remove()">Удалить</Button>
          </template>

          <template v-else>
            <Button
              v-if="isEdit && canDelete"
              type="button"
              variant="destructive"
              class="sm:mr-auto"
              @click="isConfirmingDelete = true"
            >
              Удалить
            </Button>
            <DialogClose as-child>
              <Button type="button" variant="subtle">Отмена</Button>
            </DialogClose>
            <Button type="submit" :disabled="hasBlockingConflicts">{{ submitLabel }}</Button>
          </template>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
