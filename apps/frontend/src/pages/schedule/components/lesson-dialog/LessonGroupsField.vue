<script setup lang="ts">
import type { StudentGroup } from '@/domain/student-group.ts';

interface Props {
  groups: StudentGroup[];
  /** Групп больше одной — нагрузка расставляется потоком. */
  isStream: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">Группы</span>
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="group in groups"
        :key="group.id"
        class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
      >
        {{ group.name }} · {{ group.size }} чел.
      </span>
    </div>
    <p class="text-sm text-muted-foreground">
      {{
        isStream
          ? 'Поток расставляется целиком: занятие займёт все группы потока.'
          : 'Состав групп фиксируется в занятии на момент создания.'
      }}
    </p>
  </div>
</template>
