<script setup lang="ts">
import { computed } from 'vue';
import { Plus } from '@lucide/vue';
import { useRoute } from 'vue-router';

import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';

/** Подписи кнопки действия по ключу из `route.meta.action`. */
const ACTION_LABELS = {
  'add-load': 'Добавить нагрузку',
  'add-teacher': 'Добавить преподавателя',
  'add-room': 'Добавить аудиторию',
  'add-student-group': 'Добавить группу',
} as const;

const route = useRoute();
const workspaceAction = useWorkspaceAction();

const title = computed(() => route.meta.title);
const view = computed(() => route.meta.view);
const actionLabel = computed(() => (route.meta.action ? ACTION_LABELS[route.meta.action] : null));
</script>

<template>
  <div
    class="h-14 shrink-0 flex flex-row items-center justify-between gap-4 border shadow-sm bg-background px-4 rounded-md"
  >
    <div class="flex min-w-0 flex-col">
      <Breadcrumb>
        <BreadcrumbList>
          <template v-if="view">
            <BreadcrumbItem>
              <BreadcrumbLink>{{ title }}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ view }}</BreadcrumbPage>
            </BreadcrumbItem>
          </template>
          <BreadcrumbItem v-else>
            <BreadcrumbPage>{{ title }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 class="text-base font-bold truncate">{{ title }}</h1>
    </div>

    <Button v-if="actionLabel" variant="subtle" @click="workspaceAction?.run()">
      <Plus :size="16" />
      {{ actionLabel }}
    </Button>
  </div>
</template>
