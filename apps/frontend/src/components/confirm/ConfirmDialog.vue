<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Кнопка подтверждения красная — необратимое действие. */
  destructive?: boolean;
  /** Действие выполнить нельзя: подтверждение заблокировано. */
  blocked?: boolean;
  cancelLabel?: string;
}

withDefaults(defineProps<Props>(), {
  destructive: false,
  blocked: false,
  cancelLabel: 'Отмена',
});
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value) emit('cancel');
      }
    "
  >
    <DialogContent data-slot="confirm-dialog" class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button type="button" variant="subtle" @click="emit('cancel')">{{ cancelLabel }}</Button>
        <Button
          type="button"
          :variant="destructive ? 'destructive' : 'default'"
          :disabled="blocked"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
