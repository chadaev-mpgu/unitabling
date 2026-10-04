<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="list-row-value"
    :class="
      cn(
        'text-muted-foreground col-start-3 row-start-1 shrink-0 text-[10px] leading-5 tabular-nums',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
