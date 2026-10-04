<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from '@lucide/vue';
import { RouterLink } from 'vue-router';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils.ts';
import type { ProjectConflict } from '@/domain/conflict.ts';

interface Props {
  /** Конфликты проекта: ошибки первыми, затем предупреждения. */
  conflicts: ProjectConflict[];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();

/** Сколько конфликтов оставляем в списке на панели — остальное видно в расписании. */
const PREVIEW_LIMIT = 6;

function preview(conflicts: ProjectConflict[]): ProjectConflict[] {
  return conflicts.slice(0, PREVIEW_LIMIT);
}

function rowClass(severity: ProjectConflict['severity']): string {
  return severity === 'error'
    ? 'border-l-destructive bg-destructive-subtle/50'
    : 'border-l-attention bg-attention-subtle/50';
}

function iconClass(severity: ProjectConflict['severity']): string {
  return severity === 'error' ? 'text-destructive' : 'text-attention';
}
</script>

<template>
  <Card data-slot="dashboard-conflicts" :class="cn('gap-3', props.class)">
    <CardHeader>
      <CardTitle>Конфликты</CardTitle>
      <span
        v-if="conflicts.length"
        data-slot="dashboard-conflicts-count"
        class="col-start-2 row-start-1 justify-self-end rounded-full bg-destructive-subtle px-2 py-0.5 text-[10px] font-medium text-destructive"
      >
        {{ conflicts.length }}
      </span>
    </CardHeader>

    <CardContent class="flex flex-col gap-3">
      <div
        v-if="!conflicts.length"
        data-slot="dashboard-conflicts-empty"
        class="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground"
      >
        <CircleCheck class="size-4 shrink-0 text-primary" />
        Конфликтов в расписании не обнаружено
      </div>

      <template v-else>
        <ul
          data-slot="dashboard-conflicts-list"
          class="flex max-h-64 flex-col gap-1.5 overflow-y-auto"
        >
          <li
            v-for="conflict in preview(conflicts)"
            :key="conflict.id"
            :data-slot="`dashboard-conflict-${conflict.severity}`"
            class="flex items-start gap-2 rounded-md border border-border border-l-4 px-3 py-2"
            :class="cn(rowClass(conflict.severity))"
          >
            <TriangleAlert
              v-if="conflict.severity === 'error'"
              class="mt-0.5 size-4 shrink-0"
              :class="cn(iconClass(conflict.severity))"
            />
            <CircleAlert
              v-else
              class="mt-0.5 size-4 shrink-0"
              :class="cn(iconClass(conflict.severity))"
            />
            <span class="min-w-0 flex-1 text-sm">{{ conflict.message }}</span>
          </li>
        </ul>

        <p v-if="conflicts.length > preview.length" class="text-xs text-muted-foreground">
          И ещё {{ conflicts.length - preview.length }} — в расписании.
        </p>
      </template>

      <RouterLink
        to="/schedule"
        data-slot="dashboard-conflicts-link"
        :class="cn(buttonVariants({ variant: 'subtle' }), 'self-start')"
      >
        Перейти к расписанию
        <ArrowRight class="size-4" />
      </RouterLink>
    </CardContent>
  </Card>
</template>
