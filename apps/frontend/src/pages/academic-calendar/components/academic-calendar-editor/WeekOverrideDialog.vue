<script setup lang="ts">
import { ref, watch } from 'vue';
import { CalendarRange } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { weekRangeLabel, type CalendarWeekView } from '@/domain/academic-calendar-view.ts';

interface PatternOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  week: CalendarWeekView | null;
  patternOptions: PatternOption[];
  defaultPatternName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ apply: [patternId: string | null]; cancel: [] }>();

/** Значение выбора «как в календаре» — неделя без собственной замены. */
const INHERIT_VALUE = '__default__';

const selected = ref<string>(INHERIT_VALUE);

/** Открытие на другой неделе подставляет её текущий шаблон. */
watch(
  () => [props.open, props.week?.index, props.week?.isOverride, props.week?.patternId] as const,
  ([open]) => {
    if (open) selected.value = props.week?.isOverride ? props.week.patternId : INHERIT_VALUE;
  },
  { immediate: true },
);

function apply(): void {
  emit('apply', selected.value === INHERIT_VALUE ? null : selected.value);
}
</script>

<template>
  <Dialog
    :open="props.open"
    @update:open="
      (value) => {
        if (!value) emit('cancel');
      }
    "
  >
    <DialogContent data-slot="week-override-dialog" class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>Изменить неделю</DialogTitle>
        <DialogDescription>
          Замена шаблона действует только на выбранную неделю календаря.
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="props.week"
        data-slot="week-override-selected"
        class="flex flex-col gap-0.5 rounded-md border border-primary/30 bg-primary-subtle px-3 py-2"
      >
        <span class="text-[10px] font-medium tracking-wide text-primary uppercase">Выбрано</span>
        <span class="flex items-center gap-2 text-sm font-semibold">
          <CalendarRange class="size-4" />
          Неделя №{{ props.week.index }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ weekRangeLabel(props.week.start, props.week.end) }}
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-xs tracking-wide text-muted-foreground uppercase">Шаблон недели</Label>
        <Select v-model="selected">
          <SelectTrigger class="w-full" aria-label="Шаблон выбранной недели">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="INHERIT_VALUE">
              Как в календаре ({{ props.defaultPatternName }})
            </SelectItem>
            <SelectItem v-for="option in props.patternOptions" :key="option.id" :value="option.id">
              {{ option.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-[11px] text-muted-foreground">
          «Как в календаре» убирает замену — неделя снова использует шаблон по умолчанию.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="subtle" @click="emit('cancel')">Отмена</Button>
        <Button type="button" @click="apply">Применить</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
