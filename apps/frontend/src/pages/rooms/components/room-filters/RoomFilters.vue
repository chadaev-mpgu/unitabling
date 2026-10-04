<script setup lang="ts">
import { computed } from 'vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROOM_CAPACITY_OPTIONS, ROOM_FILTER_ALL, type RoomFilter } from '@/domain/room-view.ts';
import { ROOM_KIND_LABELS, ROOM_KIND_OPTIONS } from '@/pages/rooms/constants.ts';

interface Props {
  modelValue: RoomFilter;
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: RoomFilter] }>();

function update(patch: Partial<RoomFilter>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

const kind = computed({
  get: () => props.modelValue.kind,
  set: (value: string) => update({ kind: value }),
});

const capacity = computed({
  get: () => props.modelValue.capacity,
  set: (value: string) => update({ capacity: value }),
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Фильтры</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Тип</span>
        <Select v-model="kind">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ROOM_FILTER_ALL">Все</SelectItem>
            <SelectItem v-for="item in ROOM_KIND_OPTIONS" :key="item" :value="item">
              {{ ROOM_KIND_LABELS[item] }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Вместимость
        </span>
        <Select v-model="capacity">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in ROOM_CAPACITY_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>
