import { computed, onScopeDispose, ref, watch } from 'vue';
import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  CircleAlert,
  ClipboardList,
  Clock,
  DoorOpen,
  GraduationCap,
  Layers,
  Timer,
  TriangleAlert,
  Users,
} from '@lucide/vue';

import { calendarWeeks, parseISODate, weekIndexByDate } from '@/domain/academic-calendar.ts';
import { buildDashboardSummary } from '@/domain/dashboard-view.ts';
import { formatHours } from '@/domain/hours.ts';
import { formatDateLong } from '@/lib/date.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useRoomStore } from '@/stores/global/room.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

import type { DashboardPeriodInfo, DashboardTileSection } from './types.ts';

const SAVED_BADGE_MS = 2500;

/**
 * Состояние панели управления: сведения о текущем проекте, показатели и
 * форма его настроек (имя и ссылка на календарь). Показатели считаются на
 * лету, поэтому реагируют на правки в любом разделе приложения.
 */
export function useDashboard() {
  const projectStore = useScheduleProjectStore();
  const calendarStore = useAcademicCalendarStore();
  const teachingLoadStore = useTeachingLoadStore();
  const lessonStore = useLessonStore();
  const teacherStore = useTeacherStore();
  const roomStore = useRoomStore();
  const studentGroupStore = useStudentGroupStore();
  const disciplineStore = useDisciplineStore();

  const project = computed(() => projectStore.currentProject);
  const calendar = computed(() => calendarStore.currentCalendar);

  /** Текущее время — граница прошедшего для часов и конфликтов. */
  const now = ref(new Date());
  const nowTimer = setInterval(() => {
    now.value = new Date();
  }, 60_000);
  onScopeDispose(() => clearInterval(nowTimer));

  const summary = computed(() =>
    buildDashboardSummary({
      calendar: calendar.value,
      loads: teachingLoadStore.loads,
      lessons: lessonStore.lessons,
      teachers: teacherStore.teachers,
      rooms: roomStore.rooms,
      studentGroups: studentGroupStore.studentGroups,
      now: now.value,
    }),
  );

  /** Период календаря проекта — read-only часть сведений о проекте. */
  const period = computed<DashboardPeriodInfo>(() => {
    const weeks = calendarWeeks(calendar.value);
    const last = weeks.at(-1);
    return {
      start: formatDateLong(parseISODate(calendar.value.startDate)),
      end: last ? formatDateLong(last.end) : '—',
      weeks: calendar.value.weeks,
      currentWeek: weekIndexByDate(calendar.value, now.value),
    };
  });

  /* ---- Настройки текущего проекта: черновик формы ---- */

  const draftName = ref(project.value?.name ?? '');
  const draftCalendarId = ref(project.value?.calendarId ?? '');

  // Смена проекта или сохранение (refresh пересоздаёт объекты) — черновик
  // подтягивается к актуальному состоянию.
  watch(
    project,
    (next) => {
      if (!next) return;
      draftName.value = next.name;
      draftCalendarId.value = next.calendarId;
    },
    { immediate: true },
  );

  const isDirty = computed(() => {
    if (!project.value) return false;
    return (
      draftName.value.trim() !== project.value.name ||
      draftCalendarId.value !== project.value.calendarId
    );
  });

  /** Смена календаря перестраивает сетку проекта — предупреждаем до сохранения. */
  const willChangeCalendar = computed(
    () => Boolean(project.value) && draftCalendarId.value !== project.value?.calendarId,
  );

  const canSave = computed(
    () => Boolean(project.value) && draftName.value.trim().length > 0 && isDirty.value,
  );

  const saving = ref(false);
  const saveError = ref<string | null>(null);
  const justSaved = ref(false);
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  async function save(): Promise<void> {
    const current = project.value;
    if (!current || !canSave.value) return;
    saving.value = true;
    saveError.value = null;
    try {
      await projectStore.updateProject({
        ...current,
        name: draftName.value.trim(),
        calendarId: draftCalendarId.value,
      });
      justSaved.value = true;
      if (savedTimer) clearTimeout(savedTimer);
      savedTimer = setTimeout(() => {
        justSaved.value = false;
      }, SAVED_BADGE_MS);
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Не удалось сохранить проект';
    } finally {
      saving.value = false;
    }
  }

  function reset(): void {
    const current = project.value;
    if (!current) return;
    draftName.value = current.name;
    draftCalendarId.value = current.calendarId;
    saveError.value = null;
  }

  onScopeDispose(() => {
    if (savedTimer) clearTimeout(savedTimer);
  });

  /* ---- Плитки показателей ---- */

  const sections = computed<DashboardTileSection[]>(() => {
    const value = summary.value;
    return [
      {
        key: 'project',
        title: 'Текущий проект',
        tiles: [
          {
            key: 'loads',
            label: 'Строки нагрузки',
            value: String(value.loads),
            hint: value.streams ? `из них потоков: ${value.streams}` : undefined,
            icon: ClipboardList,
          },
          { key: 'lessons', label: 'Занятия', value: String(value.lessons), icon: CalendarCheck },
          {
            key: 'groups',
            label: 'Группы в нагрузке',
            value: String(value.groupsInLoads),
            icon: Users,
          },
          {
            key: 'hours-total',
            label: 'Всего часов',
            value: formatHours(value.hoursTotal),
            icon: Clock,
          },
          {
            key: 'hours-scheduled',
            label: 'Расставлено часов',
            value: formatHours(value.hoursScheduled),
            icon: CalendarRange,
          },
          {
            key: 'hours-remaining',
            label: 'Остаток часов',
            value: formatHours(value.hoursRemaining),
            icon: Timer,
            tone: value.hoursRemaining < 0 ? 'attention' : 'default',
          },
          {
            key: 'conflict-errors',
            label: 'Ошибки',
            value: String(value.errors),
            icon: CircleAlert,
            tone: value.errors ? 'destructive' : 'default',
          },
          {
            key: 'conflict-warnings',
            label: 'Предупреждения',
            value: String(value.warnings),
            icon: TriangleAlert,
            tone: value.warnings ? 'attention' : 'default',
          },
        ],
      },
      {
        key: 'dictionaries',
        title: 'Справочники',
        tiles: [
          {
            key: 'teachers',
            label: 'Преподаватели',
            value: String(teacherStore.teachers.length),
            icon: GraduationCap,
          },
          {
            key: 'rooms',
            label: 'Аудитории',
            value: String(roomStore.rooms.length),
            icon: DoorOpen,
          },
          {
            key: 'groups',
            label: 'Группы',
            value: String(studentGroupStore.studentGroups.length),
            icon: Layers,
          },
          {
            key: 'disciplines',
            label: 'Дисциплины',
            value: String(disciplineStore.disciplines.length),
            icon: BookOpen,
          },
        ],
      },
    ];
  });

  return {
    project,
    period,
    summary,
    sections,
    calendarOptions: computed(() => calendarStore.calendars),
    draftName,
    draftCalendarId,
    isDirty,
    willChangeCalendar,
    canSave,
    saving,
    justSaved,
    saveError,
    save,
    reset,
  };
}
