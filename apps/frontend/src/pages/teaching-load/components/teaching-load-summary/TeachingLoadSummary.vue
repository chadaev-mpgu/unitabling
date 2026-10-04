<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListRow, ListRowTitle, ListRowValue } from '@/components/list-row';
import { formatHoursWithUnit } from '@/domain/hours.ts';
import type { TeachingLoadStats } from '@/domain/teaching-load-view.ts';

defineProps<{ stats: TeachingLoadStats }>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Сводка</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Всего строк</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.rows }}</ListRowValue>
      </ListRow>
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Всего часов</ListRowTitle>
        <ListRowValue class="text-xs">{{ formatHoursWithUnit(stats.totalHours) }}</ListRowValue>
      </ListRow>
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Запланировано</ListRowTitle>
        <ListRowValue class="text-xs">{{ formatHoursWithUnit(stats.scheduledHours) }}</ListRowValue>
      </ListRow>
    </CardContent>
  </Card>
</template>
