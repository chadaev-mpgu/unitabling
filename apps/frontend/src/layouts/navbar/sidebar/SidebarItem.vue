<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { Primitive } from 'reka-ui';
import { cn } from '@/lib/utils';
import { sidebarItemVariants } from './index';

interface Props extends PrimitiveProps {
  /** Lucide icon rendered inside the item. */
  icon?: LucideIcon;
  /** Highlight the item as the current route. */
  active?: boolean;
  /** Disable the item (blocks clicks and focus). */
  disabled?: boolean;
  /** Show the attention dot in the bottom-right corner. */
  hasBadge?: boolean;
  /** Accessible name for the icon-only button (used as `aria-label`). */
  label?: string;
  /** Icon size in pixels. */
  iconSize?: number;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  iconSize: 20,
});
</script>

<template>
  <Primitive
    data-slot="sidebar-item"
    :as="as"
    :as-child="asChild"
    :data-active="active ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :aria-label="label"
    :aria-disabled="disabled ? 'true' : undefined"
    :class="cn(sidebarItemVariants({ active }), props.class)"
  >
    <component :is="icon" v-if="icon && !asChild" :size="iconSize" aria-hidden="true" />
    <span
      v-if="hasBadge && !asChild"
      class="absolute left-2 bottom-2 size-2 rounded-full bg-attention ring-2 ring-background"
      aria-hidden="true"
    />
    <slot />
  </Primitive>
</template>
