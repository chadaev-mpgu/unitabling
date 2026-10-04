<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span
    data-slot="breadcrumb-page"
    role="page"
    aria-current="page"
    :class="cn('text-primary', props.class)"
  >
    <slot />
  </span>
</template>
