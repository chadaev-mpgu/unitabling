<script setup lang="ts">
import { computed, watch } from 'vue';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatHoursWithUnit } from '@/domain/hours.ts';
import {
  TEACHING_LOAD_TYPE_LABELS,
  TEACHING_LOAD_TYPE_OPTIONS,
} from '@/pages/teaching-load/constants.ts';

import { teachingLoadSchema } from './schema.ts';
import type { TeachingLoadFormValues } from './types.ts';
import { UNASSIGNED_TEACHER, useTeachingLoadDialog } from './useTeachingLoadDialog.ts';

const session = useTeachingLoadDialog();
const {
  isOpen,
  isEdit,
  isDelete,
  isSplit,
  load,
  groups,
  lessonCount,
  canRemove,
  title,
  description,
  submitLabel,
  disciplines,
  teachers,
  studentGroups,
  defaultValues,
  submitError,
} = session;

const form = useForm<TeachingLoadFormValues>({ validationSchema: teachingLoadSchema });

/* При открытии форма сбрасывается под контекст: создание или правка. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: defaultValues.value });
});

/** Часы в поле ввода: строка из input превращается в число с шагом 0,5. */
function setHours(value: string | number): void {
  form.setFieldValue('hoursTotal', Number(value));
}

const disciplineLabel = computed(() =>
  load.value
    ? (disciplines.value.find((item) => item.id === load.value?.disciplineId)?.name ?? '')
    : '',
);

const onSubmit = form.handleSubmit(async (values) => {
  if (isDelete.value || isSplit.value) return;
  await session.submit(values);
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <!-- Удаление (UC-3.4) -->
      <template v-if="isDelete">
        <p v-if="canRemove" class="text-sm text-muted-foreground">
          Строка нагрузки будет удалена. Действие необратимо.
        </p>
        <p v-else class="text-sm text-destructive">
          Нельзя удалить: на строку ссылаются занятия ({{ lessonCount }}). История и проведённые
          часы сохраняются.
        </p>

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="subtle">Отмена</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            :disabled="!canRemove"
            @click="session.remove()"
          >
            Удалить
          </Button>
        </DialogFooter>
      </template>

      <!-- Разбор потока (UC-5.5) -->
      <template v-else-if="isSplit">
        <p v-if="canRemove" class="text-sm text-muted-foreground">
          Часы потока вернутся отдельным строкам групп:
        </p>
        <p v-else class="text-sm text-destructive">
          Поток с занятиями разобрать нельзя — сначала снимите расставленные занятия.
        </p>

        <ul v-if="canRemove" class="flex flex-wrap gap-1.5">
          <li
            v-for="group in groups"
            :key="group.id"
            class="rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
          >
            {{ group.name }}
          </li>
        </ul>
        <p v-if="canRemove && load" class="text-sm text-muted-foreground">
          По {{ formatHoursWithUnit(load.hoursTotal) }} вернётся каждой группе.
        </p>

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="subtle">Отмена</Button>
          </DialogClose>
          <Button type="button" :disabled="!canRemove" @click="session.split()">Разобрать</Button>
        </DialogFooter>
      </template>

      <!-- Создание / правка преподавателя (UC-3.1, UC-3.3) -->
      <form v-else class="flex flex-col gap-4" @submit="onSubmit">
        <template v-if="isEdit">
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt class="text-muted-foreground">Дисциплина</dt>
            <dd>{{ disciplineLabel }}</dd>
            <dt class="text-muted-foreground">Группы</dt>
            <dd>{{ groups.map((group) => group.name).join(', ') }}</dd>
            <dt class="text-muted-foreground">Вид занятия</dt>
            <dd>{{ load ? TEACHING_LOAD_TYPE_LABELS[load.lessonType] : '' }}</dd>
            <dt class="text-muted-foreground">Часы</dt>
            <dd>{{ load ? formatHoursWithUnit(load.hoursTotal) : '' }}</dd>
          </dl>
          <p class="text-xs text-muted-foreground">
            Дисциплина, группа, вид занятия и часы неизменяемы. Смена состава групп — только
            слиянием в поток.
          </p>
        </template>

        <template v-else>
          <FormField v-slot="{ componentField }" name="disciplineId">
            <FormItem>
              <FormLabel>Дисциплина</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Выберите дисциплину" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="discipline in disciplines"
                    :key="discipline.id"
                    :value="discipline.id"
                  >
                    {{ discipline.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="groupId">
            <FormItem>
              <FormLabel>Группа</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="group in studentGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="lessonType">
            <FormItem>
              <FormLabel>Вид занятия</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Выберите вид занятия" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="type in TEACHING_LOAD_TYPE_OPTIONS" :key="type" :value="type">
                    {{ TEACHING_LOAD_TYPE_LABELS[type] }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ value }" name="hoursTotal">
            <FormItem>
              <FormLabel>Часы</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  :model-value="value"
                  @update:model-value="setHours"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </template>

        <FormField v-slot="{ componentField }" name="teacherId">
          <FormItem>
            <FormLabel>Преподаватель</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem :value="UNASSIGNED_TEACHER">Не назначен</SelectItem>
                <SelectItem v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.fullName }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="subtle">Отмена</Button>
          </DialogClose>
          <Button type="submit">{{ submitLabel }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
