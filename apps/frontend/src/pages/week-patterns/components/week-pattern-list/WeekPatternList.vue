<script setup lang="ts">
import { Plus } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveColor } from '@/domain/color.ts';
import type { WeekPatternListItem } from '@/pages/week-patterns/useWeekPatternEditor.ts';

interface Props {
  rows: WeekPatternListItem[];
  selectedKey: string;
}

defineProps<Props>();
const emit = defineEmits<{ select: [key: string]; create: [] }>();
</script>

<template>
  <Card data-slot="week-pattern-list" class="gap-3">
    <CardHeader>
      <CardTitle>Шаблоны недели</CardTitle>
      <Button
        variant="subtle"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Добавить шаблон недели"
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
        data-slot="week-pattern-list-item"
        class="flex flex-col rounded-md border border-l-4 px-3 py-2 text-left transition-colors"
        :style="{
          borderLeftColor: resolveColor(row.color).foreground,
          backgroundColor: row.key === selectedKey ? resolveColor(row.color).background : undefined,
        }"
        :class="row.key === selectedKey ? '' : 'hover:bg-muted/60'"
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
