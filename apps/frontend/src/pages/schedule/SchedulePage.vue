<script setup lang="ts">
import { computed, ref } from 'vue';
import { CalendarDays } from '@lucide/vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ListRow,
  ListRowDescription,
  ListRowDragHandle,
  ListRowTitle,
  ListRowValue,
} from '@/components/list-row';
import { weekIndexByDate } from '@/domain/academic-calendar.ts';
import { Color, resolveColor } from '@/domain/color.ts';
import type { ProjectConflict } from '@/domain/conflict.ts';
import { formatHours } from '@/domain/hours.ts';
import { disciplineName, findDiscipline, groupName, teacherShortName } from '@/domain/lookups.ts';
import {
  buildScheduleLessons,
  ScheduleViewMode,
  type ScheduleLesson,
} from '@/domain/schedule-view.ts';
import type { TeachingLoad } from '@/domain/teaching-load.ts';
import { periodOfWeek } from '@/domain/week.ts';
import { cn } from '@/lib/utils.ts';
import { LessonDialog, provideLessonDialog } from '@/pages/schedule/components/lesson-dialog';
import { ScheduleConflictDock } from '@/pages/schedule/components/schedule-conflict-dock';
import { ScheduleToolbar } from '@/pages/schedule/components/schedule-toolbar';
import {
  SCHEDULE_LOAD_DND_TYPE,
  ScheduleGrid,
  type ScheduleCellFocus,
  type ScheduleLessonClick,
  type ScheduleLoadDrop,
} from '@/pages/schedule/components/schedule-grid';
import { SCHEDULE_SLOTS } from '@/pages/schedule/constants.ts';
import { useScheduleConflicts } from '@/pages/schedule/useScheduleConflicts.ts';
import { useScheduleView } from '@/pages/schedule/useScheduleView.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useRoomStore } from '@/stores/global/room.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

const {
  mode,
  targetId,
  period,
  weeks,
  days,
  gridLessons,
  layoutLessons,
  panelLoads,
  periodParities,
  now,
  hoursFor,
  pastParitiesFor,
  setTargetId,
} = useScheduleView();

const teachingLoadStore = useTeachingLoadStore();
const academicCalendarStore = useAcademicCalendarStore();
const disciplineStore = useDisciplineStore();
const teacherStore = useTeacherStore();
const roomStore = useRoomStore();
const studentGroupStore = useStudentGroupStore();

/** Конфликты проекта — для нижнего дока и пометок на карточках сетки. */
const { conflicts, errorLessonIds } = useScheduleConflicts({ now });

/** Справочники, нужные для сборки view-model занятий. */
function scheduleContext() {
  return {
    loads: teachingLoadStore.loads,
    disciplines: disciplineStore.disciplines,
    teachers: teacherStore.teachers,
    rooms: roomStore.rooms,
    calendar: academicCalendarStore.currentCalendar,
    period: period.value,
    now: now.value,
    errorLessonIds: errorLessonIds.value,
  };
}

/** Карточки сетки — вхождения недель периода. */
const lessons = computed<ScheduleLesson[]>(() =>
  buildScheduleLessons({ lessons: gridLessons.value, ...scheduleContext() }),
);

/** Занятость половин клетки — уроки вида, чьи диапазоны пересекают период. */
const occupancyLessons = computed<ScheduleLesson[]>(() =>
  buildScheduleLessons({ lessons: layoutLessons.value, ...scheduleContext() }),
);

const lessonDialog = provideLessonDialog({
  layoutLessons,
  period,
  now,
});

/**
 * Перенос карточки нагрузки из «Текущая нагрузка»: открывает диалог,
 * который собирает CreateLessonRequest и сохраняет занятие.
 */
function onLoadDrop({ day, slot, loadId, parity }: ScheduleLoadDrop) {
  lessonDialog.open({
    kind: 'create',
    day,
    slot,
    loadId,
    parity,
    // В виде по аудитории подставляем выбранную аудиторию в диалог.
    roomId: mode.value === ScheduleViewMode.Room ? (targetId.value ?? undefined) : undefined,
  });
}

/** Клик по занятию: диалог открывается в режиме правки (UC-4.3). */
function onLessonClick({ day, slot, lesson }: ScheduleLessonClick) {
  lessonDialog.open({ kind: 'edit', day, slot, lessonId: lesson.id });
}

/* Переход к конфликту из нижнего дока */

/** Клетка для подсветки; новый объект — новый переход. */
const focusCell = ref<ScheduleCellFocus | null>(null);

/**
 * «Перейти к ячейке»: включает вид по сущности конфликта и показывает период
 * с конфликтующей неделей — текущий, если конфликт есть и в нём. Сетка
 * подсвечивает клетку после смены периода и вида.
 */
function onConflictNavigate(conflict: ProjectConflict) {
  mode.value = conflict.focus.mode;
  setTargetId(conflict.focus.targetId);

  const visible = conflict.weeks.some(
    (week) => week >= period.value.from && week <= period.value.to,
  );
  if (!visible) {
    // Ближайшая будущая неделя конфликта; все прошедшие — последняя.
    const currentWeek = weekIndexByDate(academicCalendarStore.currentCalendar, now.value) ?? 1;
    const week = conflict.weeks.find((index) => index >= currentWeek) ?? conflict.weeks.at(-1)!;
    period.value = periodOfWeek(week, weeks.value.length);
  }

  focusCell.value = { day: conflict.weekday, slotId: conflict.slotIndex };
}

/* DnD ЛОГИКА ПЕРЕТАСКИВАНИЯ КАРТОЧКИ */

/** id карточки, которую сейчас тащат (для визуального состояния). */
const draggingLoadId = ref<string | null>(null);

function onLoadDragStart(event: DragEvent, load: TeachingLoad) {
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return;
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(SCHEDULE_LOAD_DND_TYPE, load.id);
  // Firefox не запускает drag без text/plain payload.
  dataTransfer.setData('text/plain', load.id);
  draggingLoadId.value = load.id;
}

function onLoadDragEnd() {
  draggingLoadId.value = null;
}

/* Цвет и подписи карточек нагрузки */

function resolveLoadColor(load: TeachingLoad) {
  const discipline = findDiscipline(disciplineStore.disciplines, load.disciplineId);
  return resolveColor(discipline?.color ?? Color.Blue);
}

function teacherLabel(load: TeachingLoad) {
  return load.teacherId ? teacherShortName(teacherStore.teachers, load.teacherId) : 'Не назначен';
}
</script>

<template>
  <LessonDialog :slot-count="SCHEDULE_SLOTS.length" />

  <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
    <!-- Workspace content: прокручивается, оставляя нижний док на виду -->
    <div class="flex min-h-0 w-full flex-1 flex-row gap-3 overflow-y-auto">
      <div class="w-[360px] shrink-0">
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Текущая нагрузка</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <ListRow
              v-for="load in panelLoads"
              :key="load.id"
              draggable="true"
              :marker-color="resolveLoadColor(load).foreground"
              :background-color="resolveLoadColor(load).background"
              active
              class="cursor-grab select-none active:cursor-grabbing"
              :class="cn(draggingLoadId === load.id && 'opacity-50')"
              @dragstart="onLoadDragStart($event, load)"
              @dragend="onLoadDragEnd"
            >
              <ListRowDragHandle />
              <ListRowTitle>{{
                disciplineName(disciplineStore.disciplines, load.disciplineId)
              }}</ListRowTitle>
              <ListRowDescription
                >{{ teacherLabel(load) }} ·
                {{
                  load.groupIds
                    .map((id) => groupName(studentGroupStore.studentGroups, id))
                    .join(', ')
                }}</ListRowDescription
              >
              <!-- Расставлено / всего: часы расставленных занятий и общий объём нагрузки -->
              <ListRowValue
                >{{ formatHours(hoursFor(load).scheduled) }}/{{
                  formatHours(load.hoursTotal)
                }}</ListRowValue
              >
            </ListRow>
          </CardContent>
        </Card>
      </div>

      <div class="w-full flex flex-col gap-3">
        <ScheduleToolbar
          :mode="mode"
          :target-id="targetId"
          :period="period"
          :groups="studentGroupStore.studentGroups"
          :teachers="teacherStore.teachers"
          :rooms="roomStore.rooms"
          :weeks="weeks"
          @update:mode="mode = $event"
          @update:target-id="setTargetId($event)"
          @update:period="period = $event"
        />

        <ScheduleGrid
          v-if="targetId"
          :days="days"
          :slots="SCHEDULE_SLOTS"
          :lessons="lessons"
          :layout-lessons="occupancyLessons"
          :parities="periodParities"
          :past-parities="pastParitiesFor"
          :focus-cell="focusCell"
          @lesson-click="onLessonClick"
          @load-drop="onLoadDrop"
        />

        <div
          v-else
          data-slot="schedule-empty-state"
          class="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-mist-50/40 px-6 text-center"
        >
          <CalendarDays class="size-6 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            Выберите группу, преподавателя или аудиторию, чтобы увидеть расписание
          </p>
        </div>
      </div>
    </div>

    <!-- Нижний док: конфликты проекта, переход ведёт к клетке сетки -->
    <ScheduleConflictDock
      v-if="conflicts.length"
      :conflicts="conflicts"
      class="shrink-0"
      @navigate="onConflictNavigate"
    />
  </div>
</template>
