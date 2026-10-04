<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui';
import { cn } from '@/lib/utils';
import ScrollBar from './ScrollBar.vue';

const props = withDefaults(
  defineProps<
    ScrollAreaRootProps & {
      class?: HTMLAttributes['class'];
      /**
       * Which scrollbars to render. Reka only enables scrolling on an axis whose
       * scrollbar is mounted, so this also decides whether the area can be
       * scrolled sideways. `vertical` keeps the original behaviour.
       */
      orientation?: 'vertical' | 'horizontal' | 'both';
    }
  >(),
  { orientation: 'vertical' },
);

const delegatedProps = reactiveOmit(props, 'class', 'orientation');
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-3 focus-visible:outline-1"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar v-if="orientation !== 'horizontal'" />
    <ScrollBar v-if="orientation !== 'vertical'" orientation="horizontal" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
