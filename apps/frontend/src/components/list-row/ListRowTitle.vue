<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="list-row-title"
    :class="cn('col-start-2 row-start-1 min-w-0 truncate text-xs leading-5', props.class)"
  >
    <slot />
  </div>
</template>
