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

import { teacherSchema } from './schema.ts';
import { useTeacherDialog, type TeacherFormValues } from './useTeacherDialog.ts';

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const session = useTeacherDialog();
const {
  isOpen,
  isDelete,
  title,
  description,
  submitLabel,
  references,
  canDelete,
  defaultValues,
  submitError,
} = session;

const form = useForm<TeacherFormValues>({ validationSchema: teacherSchema });

/* При открытии форма сбрасывается под контекст: создание или правка. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: defaultValues.value });
});

/** Пояснение к запрету удаления: на что ссылается преподаватель. */
const referencesLabel = computed(() => {
  const value = references.value;
  if (!value) return '';
  const parts: string[] = [];
  if (value.loads) {
    parts.push(`${value.loads} ${plural(value.loads, 'нагрузка', 'нагрузки', 'нагрузок')}`);
  }
  if (value.lessons) {
    parts.push(`${value.lessons} ${plural(value.lessons, 'занятие', 'занятия', 'занятий')}`);
  }
  return parts.join(' и ');
});

const onSubmit = form.handleSubmit(async (values) => {
  if (isDelete.value) return;
  await session.submit(values);
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <template v-if="isDelete">
        <p v-if="canDelete" class="text-sm text-muted-foreground">
          Преподаватель будет удалён из справочника. Действие необратимо.
        </p>
        <p v-else class="text-sm text-destructive">
          Нельзя удалить: на преподавателя ссылается {{ referencesLabel }}.
        </p>

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="subtle">Отмена</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            :disabled="!canDelete"
            @click="session.remove()"
          >
            Удалить
          </Button>
        </DialogFooter>
      </template>

      <form v-else class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="fullName">
          <FormItem>
            <FormLabel>Ф. И. О.</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Иванов Иван Иванович" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="position">
          <FormItem>
            <FormLabel>Должность</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Доцент кафедры" />
            </FormControl>
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
