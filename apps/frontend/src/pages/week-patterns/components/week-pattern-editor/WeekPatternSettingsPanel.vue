<script setup lang="ts">
import { X } from '@lucide/vue';

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
import { COLOR_OPTIONS, resolveColor, type Color } from '@/domain/color.ts';
import { COLOR_LABELS } from '@/pages/week-patterns/constants.ts';

interface Props {
  name: string;
  color: Color;
}

defineProps<Props>();
const emit = defineEmits<{
  'update:name': [value: string];
  'update:color': [value: Color];
  close: [];
}>();
</script>

<template>
  <Card data-slot="week-pattern-settings-panel" class="gap-3">
    <CardHeader>
      <CardTitle>Изменить настройки</CardTitle>
      <Button
        variant="ghost"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Закрыть настройки шаблона"
        @click="emit('close')"
      >
        <X class="size-4" />
      </Button>
    </CardHeader>

    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Название</Label>
        <Input
          :model-value="name"
          placeholder="Например, Стандартная"
          @update:model-value="(value) => emit('update:name', String(value))"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">
          Цвет в календаре
        </Label>
        <Select
          :model-value="color"
          @update:model-value="(value) => emit('update:color', value as Color)"
        >
          <SelectTrigger class="w-full" aria-label="Цвет шаблона в календаре">
            <span class="flex items-center gap-2">
              <span
                data-slot="week-pattern-color-dot"
                aria-hidden="true"
                class="size-3 shrink-0 rounded-full"
                :style="{ backgroundColor: resolveColor(color).foreground }"
              />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in COLOR_OPTIONS" :key="option" :value="option">
              <span class="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  class="size-3 shrink-0 rounded-full"
                  :style="{ backgroundColor: resolveColor(option).foreground }"
                />
                {{ COLOR_LABELS[option] }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p class="text-[11px] text-muted-foreground">
        Изменения применяются к текущему шаблону учебной недели.
      </p>
    </CardContent>
  </Card>
</template>
