import { ConflictType, type Conflict } from './conflict.ts';
import { firstFutureWeek } from './occurrence.ts';
import { parityMatches, WeekParity, weekBounds, type Weekday, type WeekRange } from './week.ts';

import { isHoliday, weekdayDate, type AcademicCalendar } from './academic-calendar.ts';
import type { Lesson } from './lesson.ts';
import type { Room } from './room.ts';
import type { StudentGroup } from './student-group.ts';

/** Неделя урока в предпросмотре диалога создания занятия. */
export interface LessonPreviewWeek {
  index: number;
  /** Дата занятия в этой неделе. */
  date: Date;
  /** Неделя попадает в парность урока. */
  inParity: boolean;
  /** Вхождения не будет: дата занятия — праздник. */
  holiday: boolean;
  /** Вхождения не будет: в шаблоне дня нет пары с таким номером. */
  slotUnavailable: boolean;
}

export interface LessonPreview {
  weeks: LessonPreviewWeek[];
  /** Недели, где вхождение существует. */
  occurrences: LessonPreviewWeek[];
  /** Недели в парности, где вхождения нет. */
  unavailable: LessonPreviewWeek[];
}

/** Черновик урока — то, что пользователь настраивает в диалоге. */
export interface LessonDraft {
  calendar: AcademicCalendar;
  weekday: Weekday;
  slotIndex: number;
  /** Сколько пар в шаблоне дня (пока общий шаблон для всех дней). */
  slotCount: number;
  parity: WeekParity;
  /** Не задан — все недели календаря. */
  weekRange?: WeekRange;
  teacherId?: string;
  roomId: string;
  groupIds: string[];
  /** Текущее время: граница прошедшего (docs/data-model/time-mechanics.md). */
  now: Date;
}

/** Данные проекта, нужные для анализа черновика. */
export interface LessonDraftContext {
  lessons: Lesson[];
  rooms: Room[];
  studentGroups: StudentGroup[];
}

export interface LessonDraftAnalysis {
  preview: LessonPreview;
  conflicts: Conflict[];
  /** Диапазон, который реально сохранится: прошедшие недели отрезаны. */
  effectiveWeekRange: WeekRange;
  /** Выбранные, но отрезанные недели (диапазон до первой будущей недели). */
  trimmedWeeks: number[];
}

/** Разворачивает правило урока по неделям: даты, парность, доступность слота. */
export function buildLessonPreview(draft: LessonDraft): LessonPreview {
  const { from, to } = weekBounds(draft.weekRange, draft.calendar.weeks);
  const slotUnavailable = draft.slotIndex > draft.slotCount;

  const weeks: LessonPreviewWeek[] = [];
  for (let index = from; index <= to; index++) {
    const date = weekdayDate(draft.calendar, index, draft.weekday);
    weeks.push({
      index,
      date,
      inParity: parityMatches(draft.parity, index),
      holiday: isHoliday(draft.calendar, date),
      slotUnavailable,
    });
  }

  return {
    weeks,
    occurrences: weeks.filter((week) => week.inParity && !week.holiday && !week.slotUnavailable),
    unavailable: weeks.filter((week) => week.inParity && (week.holiday || week.slotUnavailable)),
  };
}

/** Есть ли неделя, подходящая обеим парностям, в пересечении диапазонов. */
function paritiesIntersect(left: WeekParity, right: WeekParity, from: number, to: number): boolean {
  for (let index = from; index <= to; index++) {
    if (parityMatches(left, index) && parityMatches(right, index)) return true;
  }
  return false;
}

function formatWeekList(weeks: number[]): string {
  return weeks.join(', ');
}

/**
 * Анализирует черновик урока: вхождения по неделям и конфликты
 * (docs/data-model/conflicts.md). Двойные брони — error, вместимость
 * аудитории и недоступные недели — warning.
 *
 * Диапазон черновика обрезается по будущим неделям — прошедшие недели
 * в правило не попадают (docs/data-model/time-mechanics.md); анализ идёт
 * по обрезанному диапазону, иначе прошедшие вхождения давали бы ложные
 * двойные брони и блокировали правку.
 */
export function analyzeLessonDraft(
  draft: LessonDraft,
  context: LessonDraftContext,
): LessonDraftAnalysis {
  const bounds = weekBounds(draft.weekRange, draft.calendar.weeks);
  const firstFuture = firstFutureWeek(draft.calendar, draft, draft.now) ?? bounds.to + 1;
  const effectiveWeekRange: WeekRange = { from: Math.max(bounds.from, firstFuture), to: bounds.to };
  const trimmedWeeks: number[] = [];
  const trimmedTo = Math.min(bounds.to, effectiveWeekRange.from - 1);
  for (let index = bounds.from; index <= trimmedTo; index++) trimmedWeeks.push(index);

  const preview = buildLessonPreview({ ...draft, weekRange: effectiveWeekRange });
  const conflicts: Conflict[] = [];

  /* Двойные брони: та же клетка «день × пара» с пересечением недель и парности. */
  const doubleBooked = new Map<ConflictType, string[]>();
  const markDoubleBooked = (type: ConflictType, lessonId: string) => {
    const lessonIds = doubleBooked.get(type);
    if (lessonIds) lessonIds.push(lessonId);
    else doubleBooked.set(type, [lessonId]);
  };

  const draftBounds = effectiveWeekRange;
  const busyGroupIds = new Set<string>();
  const groupNames = (ids: Set<string>) =>
    [...ids]
      .map((id) => context.studentGroups.find((group) => group.id === id)?.name ?? id)
      .join(', ');

  for (const lesson of context.lessons) {
    if (lesson.weekday !== draft.weekday || lesson.slotIndex !== draft.slotIndex) continue;

    const lessonBounds = weekBounds(lesson.weekRange, draft.calendar.weeks);
    const overlapFrom = Math.max(draftBounds.from, lessonBounds.from);
    const overlapTo = Math.min(draftBounds.to, lessonBounds.to);
    if (overlapFrom > overlapTo) continue;
    if (!paritiesIntersect(draft.parity, lesson.parity, overlapFrom, overlapTo)) continue;

    if (draft.teacherId && lesson.teacherId === draft.teacherId) {
      markDoubleBooked(ConflictType.TeacherDoubleBooked, lesson.id);
    }
    if (draft.roomId && lesson.roomId === draft.roomId) {
      markDoubleBooked(ConflictType.RoomDoubleBooked, lesson.id);
    }
    if (lesson.groupIds.some((groupId) => draft.groupIds.includes(groupId))) {
      markDoubleBooked(ConflictType.GroupDoubleBooked, lesson.id);
      for (const groupId of lesson.groupIds) {
        if (draft.groupIds.includes(groupId)) busyGroupIds.add(groupId);
      }
    }
  }

  const doubleBookedMessages: Record<ConflictType, string> = {
    [ConflictType.TeacherDoubleBooked]:
      'Преподаватель уже занят в этом слоте на пересекающихся неделях',
    [ConflictType.RoomDoubleBooked]: 'Аудитория уже занята в этом слоте на пересекающихся неделях',
    [ConflictType.GroupDoubleBooked]: 'Группы уже заняты в этом слоте: ' + groupNames(busyGroupIds),
    [ConflictType.RoomCapacity]: '',
    [ConflictType.SlotUnavailable]: '',
  };

  for (const [type, lessonIds] of doubleBooked) {
    conflicts.push({ type, lessonIds, message: doubleBookedMessages[type], severity: 'error' });
  }

  /* Вместимость аудитории меньше численности групп — warning. */
  const room = context.rooms.find(({ id }) => id === draft.roomId);
  const groupSize = draft.groupIds.reduce(
    (total, groupId) => total + (context.studentGroups.find(({ id }) => id === groupId)?.size ?? 0),
    0,
  );
  if (room && room.capacity < groupSize) {
    conflicts.push({
      type: ConflictType.RoomCapacity,
      lessonIds: [],
      message: `Вместимость аудитории ${room.name} — ${room.capacity} мест, групп — ${groupSize} человек`,
      severity: 'warning',
    });
  }

  /* Недели, где вхождений не будет — warning. */
  if (preview.unavailable.length) {
    const holidayWeeks = preview.unavailable
      .filter((week) => week.holiday)
      .map(({ index }) => index);
    const noSlotWeeks = preview.unavailable
      .filter((week) => week.slotUnavailable)
      .map(({ index }) => index);

    const reasons: string[] = [];
    if (holidayWeeks.length) reasons.push(`праздники — недели ${formatWeekList(holidayWeeks)}`);
    if (noSlotWeeks.length) {
      reasons.push(`нет ${draft.slotIndex}-й пары — недели ${formatWeekList(noSlotWeeks)}`);
    }

    conflicts.push({
      type: ConflictType.SlotUnavailable,
      lessonIds: [],
      message: `Вхождения не создадутся: ${reasons.join('; ')}`,
      severity: 'warning',
    });
  }

  return { preview, conflicts, effectiveWeekRange, trimmedWeeks };
}
