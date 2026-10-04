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
import { formatHoursWithUnit } from '@/domain/hours.ts';
import { TEACHING_LOAD_TYPE_LABELS } from '@/pages/teaching-load/constants.ts';

import { streamMergeSchema } from './schema.ts';
import { useStreamMergeDialog } from './useStreamMergeDialog.ts';

const session = useStreamMergeDialog();
const { isOpen, rows, error, maxHours, submitError } = session;

const form = useForm<{ hours: number }>({ validationSchema: streamMergeSchema });

/* При открытии часы по умолчанию — минимальный остаток выбранных строк. */
watch(isOpen, (open) => {
  if (open) form.resetForm({ values: { hours: maxHours.value } });
});

function setHours(value: string | number): void {
  form.setFieldValue('hours', Number(value));
}

const onSubmit = form.handleSubmit(async (values) => {
  await session.submit(values.hours);
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Объединить в поток</DialogTitle>
        <DialogDescription>
          Часы потока вычтутся из каждой выбранной строки; превышение останется на строках групп.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2">
        <div
          v-for="row in rows"
          :key="row.load.id"
          class="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ row.discipline }}</p>
            <p class="truncate text-xs text-muted-foreground">
              {{ TEACHING_LOAD_TYPE_LABELS[row.load.lessonType] }} ·
              {{ row.groupNames.join(', ') }}
            </p>
          </div>
          <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
            остаток {{ formatHoursWithUnit(row.hours.remaining) }}
          </span>
        </div>
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <form v-else class="flex flex-col gap-3" @submit="onSubmit">
        <FormField v-slot="{ value }" name="hours">
          <FormItem>
            <FormLabel>Часы потока</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0.5"
                :max="maxHours"
                step="0.5"
                :model-value="value"
                @update:model-value="setHours"
              />
            </FormControl>
            <p class="text-xs text-muted-foreground">
              По умолчанию и не более — минимальный остаток:
              {{ formatHoursWithUnit(maxHours) }}.
            </p>
            <FormMessage />
          </FormItem>
        </FormField>

        <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="subtle">Отмена</Button>
          </DialogClose>
          <Button type="submit">Объединить в поток</Button>
        </DialogFooter>
      </form>

      <DialogFooter v-if="error">
        <DialogClose as-child>
          <Button type="button" variant="subtle">Закрыть</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
