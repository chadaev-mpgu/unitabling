<script setup lang="ts">
import { Plus } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPatternListItem } from '@/pages/day-patterns/useDayPatternEditor.ts';

interface Props {
  rows: DayPatternListItem[];
  selectedKey: string;
}

defineProps<Props>();
const emit = defineEmits<{ select: [key: string]; create: [] }>();
</script>

<template>
  <Card data-slot="day-pattern-list" class="gap-3">
    <CardHeader>
      <CardTitle>Шаблоны дня</CardTitle>
      <Button
        variant="subtle"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Добавить шаблон"
        @click="emit('create')"
      >
        <Plus class="size-4" />
      </Button>
    </CardHeader>

    <CardContent class="flex flex-col gap-2">
      <button
        v-for="row in rows"
        :key="row.key"
        type="button"
        data-slot="day-pattern-list-item"
        class="flex flex-col rounded-md border border-l-4 px-3 py-2 text-left transition-colors"
        :class="
          row.key === selectedKey
            ? 'border-primary/30 border-l-primary bg-primary-subtle'
            : 'border-border hover:bg-muted/60'
        "
        @click="emit('select', row.key)"
      >
        <span class="text-sm font-medium">{{ row.title }}</span>
        <span class="text-xs text-muted-foreground">{{ row.subtitle }}</span>
      </button>

      <p v-if="!rows.length" class="py-4 text-center text-xs text-muted-foreground">
        Шаблонов пока нет
      </p>
    </CardContent>
  </Card>
</template>
