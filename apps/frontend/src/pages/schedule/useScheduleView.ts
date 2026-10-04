import { computed, onScopeDispose, ref, watch } from 'vue';

import { calendarWeeks, weekdayDate, weekIndexByDate } from '@/domain/academic-calendar.ts';
import { loadHours, type LoadHours } from '@/domain/hours.ts';
import { pastPeriodParities } from '@/domain/occurrence.ts';
import {
  lessonMatchesView,
  lessonOccursInPeriod,
  lessonOverlapsPeriod,
  loadMatchesView,
  ScheduleViewMode,
  type ScheduleView,
} from '@/domain/schedule-view.ts';
import type { TeachingLoad } from '@/domain/teaching-load.ts';
import {
  periodOfWeek,
  periodParities as paritiesOfPeriod,
  type WeekParitySide,
  type WeekRange,
} from '@/domain/week.ts';
import { SCHEDULE_DAYS } from '@/pages/schedule/constants.ts';
import type { ScheduleDay, ScheduleSlot } from '@/pages/schedule/components/schedule-grid';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

/**
 * Состояние режима просмотра расписания: вид (группа / преподаватель /
 * аудитория), выбранная сущность и период — пара недель «числитель/знаменатель».
 */
export function useScheduleView() {
  const calendarStore = useAcademicCalendarStore();
  const lessonStore = useLessonStore();
  const teachingLoadStore = useTeachingLoadStore();
  const projectStore = useScheduleProjectStore();

  const calendar = computed(() => calendarStore.currentCalendar);
  const weeks = computed(() => calendarWeeks(calendar.value));

  const mode = ref<ScheduleViewMode>(ScheduleViewMode.Group);
  /** Выбор сущности запоминается по каждому виду отдельно. */
  const targets = ref<Record<ScheduleViewMode, string | null>>({
    [ScheduleViewMode.Group]: null,
    [ScheduleViewMode.Teacher]: null,
    [ScheduleViewMode.Room]: null,
  });
  const targetId = computed(() => targets.value[mode.value]);
  const view = computed<ScheduleView>(() => ({ mode: mode.value, targetId: targetId.value }));

  /** Период по умолчанию — пара текущей недели; вне календаря — первая пара. */
  function defaultPeriod(): WeekRange {
    return periodOfWeek(weekIndexByDate(calendar.value, new Date()) ?? 1, calendar.value.weeks);
  }
  const period = ref<WeekRange>(defaultPeriod());

  // Смена проекта меняет календарь (старт, число недель) — период пересчитываем.
  watch(
    () => projectStore.currentProjectId,
    () => {
      period.value = defaultPeriod();
    },
  );

  /**
   * Занятость половин клетки: уроки вида, чей диапазон пересекает период.
   * Парность не учитывается — половина, занятая уроком серии, не должна
   * выглядеть свободной для дропа (иначе диалог и сетка разойдутся).
   */
  const layoutLessons = computed(() => {
    const { weeks: weekCount } = calendar.value;
    return lessonStore.lessons.filter(
      (lesson) =>
        lessonMatchesView(lesson, view.value) &&
        lessonOverlapsPeriod(lesson, period.value, weekCount),
    );
  });

  /** Карточки сетки: уроки вида, у которых есть вхождение в недели периода. */
  const gridLessons = computed(() => {
    const { weeks: weekCount } = calendar.value;
    return layoutLessons.value.filter((lesson) =>
      lessonOccursInPeriod(lesson, period.value, weekCount),
    );
  });

  /** Панель нагрузки: строки вида; без выбранной сущности — все строки проекта. */
  const panelLoads = computed(() =>
    teachingLoadStore.loads.filter((load) => loadMatchesView(load, view.value)),
  );

  /** Парности половин клетки в текущем периоде. */
  const periodParities = computed(() => paritiesOfPeriod(period.value));

  /** Текущее время — граница прошедшего; обновляется раз в минуту. */
  const now = ref(new Date());
  const nowTimer = setInterval(() => {
    now.value = new Date();
  }, 60_000);
  onScopeDispose(() => clearInterval(nowTimer));

  /** Часы нагрузок: расставленные/проведённые по вхождениям уроков и остаток. */
  const hoursByLoadId = computed(() => {
    const byId = new Map<string, LoadHours>();
    for (const load of teachingLoadStore.loads) {
      byId.set(load.id, loadHours(load, lessonStore.lessons, calendar.value, now.value));
    }
    return byId;
  });

  /** Часы строки нагрузки для панели; строка без уроков — полный остаток. */
  function hoursFor(load: TeachingLoad): LoadHours {
    return (
      hoursByLoadId.value.get(load.id) ?? { scheduled: 0, conducted: 0, remaining: load.hoursTotal }
    );
  }

  /** Прошедшие половины клетки: по ним сетка и диалог блокируют постановку. */
  function pastParitiesFor(day: ScheduleDay, slot: ScheduleSlot): WeekParitySide[] {
    return pastPeriodParities(calendar.value, period.value, day.key, slot.number, now.value);
  }

  /** Дни недели с датами недель периода — вторая строка шапки сетки. */
  const days = computed<ScheduleDay[]>(() =>
    SCHEDULE_DAYS.map((day) => ({
      ...day,
      dates: {
        above: weekdayDate(calendar.value, period.value.from, day.key),
        below:
          period.value.to > period.value.from
            ? weekdayDate(calendar.value, period.value.to, day.key)
            : undefined,
      },
    })),
  );

  function setTargetId(next: string | null): void {
    targets.value[mode.value] = next;
  }

  return {
    mode,
    targetId,
    period,
    weeks,
    days,
    layoutLessons,
    gridLessons,
    panelLoads,
    periodParities,
    now,
    hoursFor,
    pastParitiesFor,
    setTargetId,
  };
}
