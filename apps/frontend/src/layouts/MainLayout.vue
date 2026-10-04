<script setup lang="ts">
import { RouterView } from 'vue-router';

import Header from '@/layouts/header/Header.vue';
import Navbar from '@/layouts/navbar/Navbar.vue';
import WorkspaceHeader from '@/layouts/workspace/WorkspaceHeader.vue';
import { provideWorkspaceAction } from '@/layouts/workspace/useWorkspaceAction.ts';

provideWorkspaceAction();
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <Header />

    <div class="flex flex-1 min-h-0">
      <Navbar class="border-r" />

      <div class="flex min-w-0 flex-1 flex-col p-3">
        <WorkspaceHeader />

        <div class="flex-1 overflow-y-auto py-3 flex flex-row gap-3">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>
