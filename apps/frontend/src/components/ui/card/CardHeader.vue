<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="card-header"
    :class="
      cn(
        'grid grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-4 gap-y-0.5',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
