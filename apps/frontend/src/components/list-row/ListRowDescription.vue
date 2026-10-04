<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="list-row-description"
    :class="
      cn(
        'text-muted-foreground col-span-full row-start-2 truncate text-[10px] leading-4',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
