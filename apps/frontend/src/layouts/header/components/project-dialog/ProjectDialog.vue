<script setup lang="ts">
import { watch } from 'vue';
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

import { projectSchema } from './schema.ts';
import { useProjectDialog, type ProjectFormValues } from './useProjectDialog.ts';

const session = useProjectDialog();
const { isOpen, calendarOptions, defaultValues, submitError } = session;

const form = useForm<ProjectFormValues>({ validationSchema: projectSchema });

/* При открытии форма сбрасывается под контекст: имя пустое, календарь текущего. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: defaultValues.value });
});

const onSubmit = form.handleSubmit(async (values) => {
  await session.submit(values);
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>Новый проект</DialogTitle>
        <DialogDescription>Заполните данные проекта</DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Название</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="ИФТИС-2-осень-2026" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="calendarId">
          <FormItem>
            <FormLabel>Академический календарь</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Выберите календарь" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="calendar in calendarOptions"
                  :key="calendar.id"
                  :value="calendar.id"
                >
                  {{ calendar.name }}
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
          <Button type="submit">Создать</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
