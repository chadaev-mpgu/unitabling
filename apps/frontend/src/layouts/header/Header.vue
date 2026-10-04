<script setup lang="ts">
import { Calendar } from '@lucide/vue';

import { ProjectDialog, provideProjectDialog } from '@/layouts/header/components/project-dialog';
import { ProjectSelect } from '@/layouts/header/components/project-select';

/* Диалог создания проекта живёт в шапке и доступен селектору проекта. */
provideProjectDialog();
</script>

<template>
  <div class="h-14 flex flex-row items-center justify-between px-4 py-2 border-b bg-background">
    <!-- Logo & Title -->
    <div class="flex flex-row items-center gap-2">
      <div class="bg-primary-subtle p-2 rounded-md">
        <Calendar :size="20" color="var(--primary)" />
      </div>
      <span class="text-sm font-bold text-foreground">UniTabling</span>
    </div>

    <!-- Project Selector -->
    <ProjectSelect />

    <!-- User Profile -->
    <div>User</div>

    <ProjectDialog />
  </div>
</template>
