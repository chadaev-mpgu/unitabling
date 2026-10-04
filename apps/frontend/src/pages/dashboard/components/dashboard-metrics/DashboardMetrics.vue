<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils.ts';
import type {
  DashboardTile,
  DashboardTileSection,
  DashboardTileTone,
} from '@/pages/dashboard/types.ts';

interface Props {
  sections: DashboardTileSection[];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

/** Цвет значения по тону: обычный, предупреждение, ошибка. */
function toneClass(tone: DashboardTileTone | undefined): string {
  if (tone === 'destructive') return 'text-destructive';
  if (tone === 'attention') return 'text-attention';
  return 'text-foreground';
}

function tileSlot(sectionKey: string, tile: DashboardTile): string {
  return `dashboard-metric-${sectionKey}-${tile.key}`;
}
</script>

<template>
  <div data-slot="dashboard-metrics" :class="cn('flex flex-col gap-3', props.class)">
    <Card v-for="section in sections" :key="section.key" class="gap-3">
      <CardHeader>
        <CardTitle>{{ section.title }}</CardTitle>
      </CardHeader>

      <CardContent class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="tile in section.tiles"
          :key="tile.key"
          :data-slot="tileSlot(section.key, tile)"
          class="flex flex-col gap-1 rounded-md border border-border bg-background px-3 py-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-xs text-muted-foreground">{{ tile.label }}</span>
            <component
              :is="tile.icon"
              class="size-4 shrink-0"
              :class="cn(toneClass(tile.tone))"
              aria-hidden="true"
            />
          </div>
          <span class="text-xl font-bold tabular-nums" :class="cn(toneClass(tile.tone))">
            {{ tile.value }}
          </span>
          <span v-if="tile.hint" class="text-[11px] text-muted-foreground">{{ tile.hint }}</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
