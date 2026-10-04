<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListRow, ListRowTitle, ListRowValue } from '@/components/list-row';
import type { TeacherStats } from '@/domain/teacher-view.ts';

defineProps<{ stats: TeacherStats }>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Сводка</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Всего</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.total }}</ListRowValue>
      </ListRow>
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>С нагрузкой</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.withLoad }}</ListRowValue>
      </ListRow>
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Без нагрузки</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.withoutLoad }}</ListRowValue>
      </ListRow>
    </CardContent>
  </Card>
</template>
