<script setup lang="ts">
import {
  Table,
  CalendarClock,
  GraduationCap,
  Users,
  ClipboardList,
  type LucideIcon,
  LayoutDashboard,
  CalendarDays,
  CalendarFold,
  DoorOpen,
} from '@lucide/vue';
import { RouterLink } from 'vue-router';
import { Sidebar, SidebarGroup, SidebarItem, SidebarSeparator } from '@/layouts/navbar/sidebar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

interface NavItem {
  readonly to: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly attend?: boolean;
}

interface NavGroup {
  readonly label?: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Панель управления' }],
  },
  {
    items: [
      { to: '/schedule', icon: Table, label: 'Сборка расписания', attend: true },
      { to: '/teaching-load', icon: ClipboardList, label: 'Учебная нагрузка' },
    ],
  },
  {
    items: [
      { to: '/day-patterns', icon: CalendarClock, label: 'Шаблоны дня' },
      { to: '/week-patterns', icon: CalendarDays, label: 'Шаблоны недели' },
      { to: '/academic-calendar', icon: CalendarFold, label: 'Академический календарь' },
    ],
  },
  {
    items: [
      { to: '/teachers', icon: GraduationCap, label: 'Преподаватели' },
      { to: '/rooms', icon: DoorOpen, label: 'Аудитории' },
      { to: '/student-groups', icon: Users, label: 'Группы' },
    ],
  },
];
</script>

<template>
  <TooltipProvider>
    <Sidebar :class="props.class">
      <template v-for="(group, idx) in groups" :key="idx">
        <SidebarGroup>
          <RouterLink
            v-for="(item, idx) in group.items"
            :key="idx"
            v-slot="{ isExactActive, href, navigate }"
            :to="item.to"
            custom
          >
            <Tooltip>
              <TooltipTrigger as-child>
                <SidebarItem
                  :as="'a'"
                  :href="href"
                  :icon="item.icon"
                  :active="isExactActive"
                  :label="item.label"
                  :has-badge="item.attend"
                  @click="navigate"
                />
              </TooltipTrigger>
              <TooltipContent side="left">{{ item.label }}</TooltipContent>
            </Tooltip>
          </RouterLink>
        </SidebarGroup>

        <SidebarSeparator v-if="idx !== groups.length - 1" />
      </template>
    </Sidebar>
  </TooltipProvider>
</template>
