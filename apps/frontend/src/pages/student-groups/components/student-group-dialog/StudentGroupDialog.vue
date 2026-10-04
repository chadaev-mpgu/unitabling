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

import { studentGroupSchema } from './schema.ts';
import { useStudentGroupDialog, type StudentGroupFormValues } from './useStudentGroupDialog.ts';

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const session = useStudentGroupDialog();
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

const form = useForm<StudentGroupFormValues>({ validationSchema: studentGroupSchema });

/* При открытии форма сбрасывается под контекст: создание или правка. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: defaultValues.value });
});

/** Число из поля ввода: пустая строка — «не задано». */
function setNumber(field: 'size' | 'courseYear' | 'admissionYear', value: string | number): void {
  form.setFieldValue(field, value === '' ? undefined : Number(value));
}

/** Пояснение к запрету удаления: на что ссылается группа. */
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
          Группа будет удалена из справочника. Действие необратимо.
        </p>
        <p v-else class="text-sm text-destructive">
          Нельзя удалить: на группу ссылается {{ referencesLabel }}.
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
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Название</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="ИПИ-21-1" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value }" name="size">
          <FormItem>
            <FormLabel>Численность</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                step="1"
                :model-value="value"
                @update:model-value="(next) => setNumber('size', next)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ value }" name="courseYear">
            <FormItem>
              <FormLabel>Курс</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  :model-value="value"
                  @update:model-value="(next) => setNumber('courseYear', next)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ value }" name="admissionYear">
            <FormItem>
              <FormLabel>Год набора</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="2000"
                  step="1"
                  placeholder="2025"
                  :model-value="value"
                  @update:model-value="(next) => setNumber('admissionYear', next)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

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
