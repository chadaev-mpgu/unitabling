<script setup lang="ts">
import type { TabsListProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { TabsList } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-card text-muted-foreground inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg py-0.75 px-2 border shadow-sm',
        props.class,
      )
    "
  >
    <slot />
  </TabsList>
</template>
