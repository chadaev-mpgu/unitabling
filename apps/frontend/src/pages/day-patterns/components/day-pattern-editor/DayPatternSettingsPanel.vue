<script setup lang="ts">
import { X } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  name: string;
}

defineProps<Props>();
const emit = defineEmits<{ 'update:name': [value: string]; close: [] }>();
</script>

<template>
  <Card data-slot="day-pattern-settings-panel" class="gap-3">
    <CardHeader>
      <CardTitle>Изменить настройки</CardTitle>
      <Button
        variant="ghost"
        class="col-start-2 row-start-1 size-8 p-0"
        aria-label="Закрыть настройки шаблона"
        @click="emit('close')"
      >
        <X class="size-4" />
      </Button>
    </CardHeader>

    <CardContent class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Название</Label>
        <Input
          :model-value="name"
          placeholder="Например, Стандартный"
          @update:model-value="(value) => emit('update:name', String(value))"
        />
      </div>

      <p class="text-[11px] text-muted-foreground">
        Изменения применяются к текущему шаблону учебного дня.
      </p>
    </CardContent>
  </Card>
</template>
