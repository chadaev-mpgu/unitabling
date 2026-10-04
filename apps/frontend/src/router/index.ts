import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import { AcademicCalendarPage } from '@/pages/academic-calendar';
import { DashboardPage } from '@/pages/dashboard';
import { DayPatternPage } from '@/pages/day-patterns';
import { RoomListPage } from '@/pages/rooms';
import { SchedulePage } from '@/pages/schedule';
import { StudentGroupListPage } from '@/pages/student-groups';
import { TeacherListPage } from '@/pages/teachers';
import { TeachingLoadPage } from '@/pages/teaching-load';
import { WeekPatternPage } from '@/pages/week-patterns';

declare module 'vue-router' {
  interface RouteMeta {
    /** Заголовок рабочей области — в крошке и h1. */
    title: string;
    /** Текущий вид экрана — вторая крошка («Общий вид»). */
    view?: string;
    /** Кнопка действия в шапке рабочей области. */
    action?: 'add-load' | 'add-teacher' | 'add-room' | 'add-student-group';
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/schedule' },

  { path: '/dashboard', component: DashboardPage, meta: { title: 'Панель управления' } },

  {
    path: '/schedule',
    component: SchedulePage,
    meta: { title: 'Сборка расписания' },
  },
  {
    path: '/teaching-load',
    component: TeachingLoadPage,
    meta: { title: 'Учебная нагрузка', view: 'Общий вид', action: 'add-load' },
  },

  { path: '/day-patterns', component: DayPatternPage, meta: { title: 'Шаблоны дня' } },
  { path: '/week-patterns', component: WeekPatternPage, meta: { title: 'Шаблоны недели' } },
  {
    path: '/academic-calendar',
    component: AcademicCalendarPage,
    meta: { title: 'Академический календарь' },
  },

  {
    path: '/teachers',
    component: TeacherListPage,
    meta: { title: 'Преподаватели', view: 'Общий вид', action: 'add-teacher' },
  },
  {
    path: '/rooms',
    component: RoomListPage,
    meta: { title: 'Аудитории', view: 'Общий вид', action: 'add-room' },
  },
  {
    path: '/student-groups',
    component: StudentGroupListPage,
    meta: { title: 'Группы', view: 'Общий вид', action: 'add-student-group' },
  },

  { path: '/:pathMatch(.*)*', redirect: '/schedule' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
