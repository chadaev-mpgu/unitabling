<script setup lang="ts">
import { CalendarDays, Plus } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils.ts';
import type { AcademicCalendarListItem } from '@/pages/academic-calendar/useAcademicCalendarEditor.ts';

interface Props {
  rows: AcademicCalendarListItem[];
  selectedKey: string;
}

defineProps<Props>();
const emit = defineEmits<{ select: [key: string]; create: [] }>();
</script>

<template>
  <Card data-slot="academic-calendar-list" class="gap-3">
    <CardHeader>
      <CardTitle>Академ. календари</CardTitle>
      <Button
        variant="subtle"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Добавить календарь"
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
        data-slot="academic-calendar-list-item"
        class="flex flex-col rounded-md border px-3 py-2 text-left transition-colors"
        :class="
          cn(row.key === selectedKey ? 'border-primary/30 bg-primary-subtle' : 'hover:bg-muted/60')
        "
        @click="emit('select', row.key)"
      >
        <span class="flex items-center gap-2 text-sm font-medium">
          <CalendarDays class="size-4 shrink-0 text-muted-foreground" />
          <span class="truncate">{{ row.title }}</span>
        </span>
        <span class="truncate text-xs text-muted-foreground">{{ row.subtitle }}</span>
      </button>

      <p v-if="!rows.length" class="py-4 text-center text-xs text-muted-foreground">
        Календарей пока нет
      </p>
    </CardContent>
  </Card>
</template>
