<script setup lang="ts">
import { Plus } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectDialog } from '@/layouts/header/components/project-dialog';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';

const projectStore = useScheduleProjectStore();
const projectDialog = useProjectDialog();

/** Select отдаёт широкий тип значения — берём только id проекта. */
function onProjectChange(value: unknown): void {
  if (typeof value === 'string') projectStore.setCurrentProject(value);
}
</script>

<template>
  <div class="flex flex-row items-center gap-1">
    <Select
      :model-value="projectStore.currentProjectId ?? ''"
      @update:model-value="onProjectChange"
    >
      <SelectTrigger class="w-65">
        <SelectValue placeholder="Выберите проект" />
      </SelectTrigger>
      <SelectContent>
        <!--
          key включает имя: reka-ui запоминает textContent пункта только при
          монтировании, поэтому после переименования проекта пункт нужно
          пересоздать, иначе селект покажет старое имя.
        -->
        <SelectItem
          v-for="project in projectStore.projects"
          :key="`${project.id}:${project.name}`"
          :value="project.id"
        >
          {{ project.name }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Button
      variant="subtle"
      class="h-9 w-9 p-0"
      aria-label="Создать проект"
      @click="projectDialog.open()"
    >
      <Plus :size="16" />
    </Button>
  </div>
</template>
