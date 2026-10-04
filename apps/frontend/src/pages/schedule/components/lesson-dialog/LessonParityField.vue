<script setup lang="ts">
import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { WeekParity } from '@/domain/week.ts';

import { PARITY_OPTIONS } from './constants.ts';

interface Props {
  /** Exam/Credit ставится на одну неделю — парность не выбирается. */
  singleWeek: boolean;
  /** Парности, допустимые в целевой клетке. */
  allowed: WeekParity[];
}

const props = defineProps<Props>();

const options = computed(() =>
  PARITY_OPTIONS.filter((option) => props.allowed.includes(option.value)),
);

/** Свободна ровно одна половина — подсказываем, какая. */
const hint = computed(() => {
  const only = options.value.length === 1 ? options.value[0] : undefined;
  if (only && only.value !== WeekParity.Both) return `Свободна только половина «${only.label}»`;
  return 'Над чертой — нечётные недели, под чертой — чётные.';
});
</script>

<template>
  <FormField v-if="!singleWeek" v-slot="{ value, setValue }" name="parity">
    <FormItem>
      <FormLabel>Парность</FormLabel>
      <FormControl>
        <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Парность">
          <Button
            v-for="option in options"
            :key="option.value"
            type="button"
            :variant="value === option.value ? 'default' : 'secondary'"
            :aria-pressed="value === option.value"
            @click="setValue(option.value)"
          >
            {{ option.label }}
          </Button>
        </div>
      </FormControl>
      <FormDescription>{{ hint }}</FormDescription>
    </FormItem>
  </FormField>
</template>
