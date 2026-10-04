<script setup lang="ts">
import { Copy, RotateCcw, Save, SlidersHorizontal, Trash2, TriangleAlert } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  title: string;
  stats: string;
  isNew: boolean;
  isDirty: boolean;
  canSave: boolean;
  canDelete: boolean;
  canDeleteHint: string;
  settingsVisible: boolean;
  error: string | null;
}

defineProps<Props>();
const emit = defineEmits<{
  save: [];
  revert: [];
  duplicate: [];
  remove: [];
  'toggle-settings': [];
}>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <Card
      data-slot="academic-calendar-toolbar"
      class="flex-row flex-wrap items-center justify-between gap-3 py-3"
    >
      <div class="flex min-w-[220px] flex-1 flex-col gap-0.5">
        <div class="flex min-w-0 items-center gap-2">
          <h2 class="truncate text-base font-bold">Разметка календаря</h2>
          <span
            v-if="isDirty"
            data-slot="academic-calendar-unsaved"
            class="shrink-0 rounded-full bg-attention-subtle px-2 py-0.5 text-[10px] font-medium text-attention"
          >
            Не сохранено
          </span>
        </div>
        <p class="truncate text-xs text-muted-foreground">{{ title }} · {{ stats }}</p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Button variant="subtle" :disabled="!isDirty" @click="emit('revert')">
          <RotateCcw class="size-4" />
          Сбросить
        </Button>
        <Button :disabled="!canSave" @click="emit('save')">
          <Save class="size-4" />
          Сохранить настройки
        </Button>
        <Button
          variant="subtle"
          class="size-9 p-0"
          aria-label="Дублировать календарь"
          title="Дублировать календарь"
          @click="emit('duplicate')"
        >
          <Copy class="size-4" />
        </Button>
        <Button
          variant="subtle"
          class="size-9 p-0"
          :aria-pressed="settingsVisible"
          aria-label="Настройки календаря"
          title="Настройки календаря"
          @click="emit('toggle-settings')"
        >
          <SlidersHorizontal class="size-4" />
        </Button>
        <Button
          variant="destructive"
          class="size-9 p-0"
          :disabled="isNew"
          aria-label="Удалить календарь"
          :title="canDelete ? 'Удалить календарь' : canDeleteHint"
          @click="emit('remove')"
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </Card>

    <div
      v-if="isDirty"
      data-slot="academic-calendar-warning"
      class="flex items-start gap-2 rounded-lg border border-attention/30 bg-attention-subtle px-3 py-2 text-xs text-attention"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" />
      <p>
        Календарь общий для всех проектов: каникулы отменяют вхождения уроков на эти даты и
        возвращают их часы в нерасставленную нагрузку.
      </p>
    </div>

    <p v-if="error" data-slot="academic-calendar-error" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>
