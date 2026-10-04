<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="sidebar-separator"
    role="separator"
    :class="cn('my-2 h-px w-10 bg-border', props.class)"
  >
    <slot />
  </div>
</template>
