<script setup lang="ts">
import { computed } from 'vue';

import { ListRow, ListRowTitle, ListRowValue } from '@/components/list-row';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomStats } from '@/domain/room-view.ts';
import { ROOM_KIND_OPTIONS, ROOM_KIND_SUMMARY_LABELS } from '@/pages/rooms/constants.ts';

const props = defineProps<{ stats: RoomStats }>();

/** Виды сводки: «прочие» показываем, только если такие аудитории есть. */
const kinds = computed(() =>
  ROOM_KIND_OPTIONS.filter((kind) => kind !== 'other' || props.stats.byKind.other > 0),
);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Сводка</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <ListRow>
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>Всего аудиторий</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.total }}</ListRowValue>
      </ListRow>
      <ListRow v-for="kind in kinds" :key="kind">
        <span class="col-start-1 row-start-1 size-2.5 rounded-[2px] bg-muted-foreground/30" />
        <ListRowTitle>{{ ROOM_KIND_SUMMARY_LABELS[kind] }}</ListRowTitle>
        <ListRowValue class="text-xs">{{ stats.byKind[kind] }}</ListRowValue>
      </ListRow>
    </CardContent>
  </Card>
</template>
