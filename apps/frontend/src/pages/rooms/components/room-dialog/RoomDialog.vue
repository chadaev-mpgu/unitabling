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
import { ROOM_KIND_LABELS, ROOM_KIND_OPTIONS } from '@/pages/rooms/constants.ts';

import { roomSchema } from './schema.ts';
import { useRoomDialog, type RoomFormValues } from './useRoomDialog.ts';

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const session = useRoomDialog();
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

const form = useForm<RoomFormValues>({ validationSchema: roomSchema });

/* При открытии форма сбрасывается под контекст: создание или правка. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: defaultValues.value });
});

/** Вместимость в поле ввода: строка из input превращается в число. */
function setCapacity(value: string | number): void {
  form.setFieldValue('capacity', Number(value));
}

/** Пояснение к запрету удаления: сколько занятий ссылается на аудиторию. */
const referencesLabel = computed(() => {
  const value = references.value;
  if (!value) return '';
  return `${value.lessons} ${plural(value.lessons, 'занятие', 'занятия', 'занятий')}`;
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
          Аудитория будет удалена из справочника. Действие необратимо.
        </p>
        <p v-else class="text-sm text-destructive">
          Нельзя удалить: на аудиторию ссылается {{ referencesLabel }}.
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
              <Input v-bind="componentField" placeholder="305" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="kind">
          <FormItem>
            <FormLabel>Вид</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Выберите вид аудитории" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="kind in ROOM_KIND_OPTIONS" :key="kind" :value="kind">
                  {{ ROOM_KIND_LABELS[kind] }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value }" name="capacity">
          <FormItem>
            <FormLabel>Вместимость</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                step="1"
                :model-value="value"
                @update:model-value="setCapacity"
              />
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
