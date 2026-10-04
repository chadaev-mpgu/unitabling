<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <nav
    data-slot="sidebar"
    :class="
      cn('flex h-full w-16 shrink-0 flex-col items-center gap-1 bg-background py-3', props.class)
    "
  >
    <slot />
  </nav>
</template>
