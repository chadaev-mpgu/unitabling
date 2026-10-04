import { groupName, roomName, teacherName } from './lookups.ts';
import { occurrenceEnd, occurrenceWeeks } from './occurrence.ts';
import { ScheduleViewMode } from './schedule-view.ts';
import { WEEKDAY_SHORT_LABELS, type Weekday } from './week.ts';

import type { AcademicCalendar } from './academic-calendar.ts';
import type { Lesson } from './lesson.ts';
import type { Room } from './room.ts';
import type { StudentGroup } from './student-group.ts';
import type { Teacher } from './teacher.ts';

export enum ConflictType {
  TeacherDoubleBooked = 'teacher-double-booked',
  RoomDoubleBooked = 'room-double-booked',
  GroupDoubleBooked = 'group-double-booked',
  RoomCapacity = 'room-capacity',
  SlotUnavailable = 'slot-unavailable',
}

/** Конфликт занятия: error блокирует сохранение, warning — только предупреждает. */
export interface Conflict {
  type: ConflictType;
  lessonIds: string[];
  message: string;
  severity: 'error' | 'warning';
}

/** Вид и сущность, к которым ведёт «Перейти к ячейке» в панели конфликтов. */
export interface ConflictFocus {
  mode: ScheduleViewMode;
  targetId: string;
}

/** Конфликт проекта: `Conflict` плюс место в сетке и переход к нему. */
export interface ProjectConflict extends Conflict {
  /** Ключ списка: тип, сущность, клетка и состав нагрузок конфликта. */
  id: string;
  /** День и пара, в которых конфликт наблюдается. */
  weekday: Weekday;
  slotIndex: number;
  /** Недели календаря с конфликтующими вхождениями, по возрастанию. */
  weeks: number[];
  focus: ConflictFocus;
}

/** Данные проекта, нужные для детекции конфликтов. */
export interface ProjectConflictContext {
  lessons: Lesson[];
  calendar: AcademicCalendar;
  teachers: Teacher[];
  rooms: Room[];
  studentGroups: StudentGroup[];
  /** Текущее время: прошедшие вхождения — история, конфликты по ним не считаем. */
  now: Date;
}

/**
 * Недели, в которых у урока есть ещё не прошедшее вхождение: прошедшее
 * зафиксировано дроблением и правке недоступно (docs/data-model/time-mechanics.md),
 * поэтому и конфликт по нему чинить негде.
 */
function upcomingWeeks(calendar: AcademicCalendar, lesson: Lesson, now: Date): number[] {
  return occurrenceWeeks(calendar, lesson).filter((week) => {
    const end = occurrenceEnd(calendar, lesson, week);
    return end !== null && end.getTime() >= now.getTime();
  });
}

/** «2 пары», «3 пары», «5 пар» — счёт занятий, попавших в одну клетку. */
function pairCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} пара`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} пары`;
  return `${count} пар`;
}

/** Подпись клетки: «Вт, 3 пара». */
function cellLabel(weekday: Weekday, slotIndex: number): string {
  return `${WEEKDAY_SHORT_LABELS[weekday]}, ${slotIndex} пара`;
}

/** Группирует уроки по ключу; порядок уроков сохраняется. */
function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/** Один урок одной клетки: вхождения правила в конкретную неделю. */
interface CellLesson {
  lesson: Lesson;
  week: number;
}

/** Накопитель конфликта: недели, участники и счёт для подписи. */
interface ConflictDraft {
  base: Omit<ProjectConflict, 'weeks' | 'lessonIds' | 'message'>;
  /** Уроки конфликта — включая все фрагменты дробления. */
  participants: Set<string>;
  weeks: Set<number>;
  /** Максимум занятий, сходившихся в клетке за одну неделю. */
  count: number;
  /** Подпись собирается по итоговому счёту. */
  message: (count: number) => string;
}

/**
 * Конфликты проекта по всем урокам, на уровне вхождений
 * (docs/data-model/conflicts.md): двойные брони преподавателя, аудитории
 * и групп — error, вместимость аудитории — warning. Один конфликт
 * объединяет все недели, в которых совпадает один и тот же состав уроков;
 * прошедшие вхождения не учитываются — это история.
 */
export function detectProjectConflicts({
  lessons,
  calendar,
  teachers,
  rooms,
  studentGroups,
  now,
}: ProjectConflictContext): ProjectConflict[] {
  const found = new Map<string, ConflictDraft>();

  /**
   * Заводит конфликт или дописывает его: один конфликт объединяет недели,
   * в которых сходится тот же состав нагрузок. Ключ считается по нагрузкам,
   * поэтому дробление урока на прошедший и будущий фрагменты
   * (docs/data-model/time-mechanics.md) не плодит дубли, а в `lessonIds`
   * попадают все фрагменты.
   */
  function record(
    base: Omit<ProjectConflict, 'id' | 'weeks' | 'lessonIds' | 'message'>,
    participants: Lesson[],
    weeks: number[],
    message: (count: number) => string,
  ): void {
    const loadIds = [...new Set(participants.map(({ teachingLoadId }) => teachingLoadId))].sort();
    const id = [base.type, base.focus.targetId, base.weekday, base.slotIndex, ...loadIds].join(':');
    const draft = found.get(id);
    if (!draft) {
      found.set(id, {
        base: { ...base, id },
        participants: new Set(participants.map(({ id: lessonId }) => lessonId)),
        weeks: new Set(weeks),
        count: participants.length,
        message,
      });
      return;
    }

    for (const { id: lessonId } of participants) draft.participants.add(lessonId);
    for (const week of weeks) draft.weeks.add(week);
    draft.count = Math.max(draft.count, participants.length);
  }

  /* Вхождения уроков, сгруппированные по клетке «день × пара × неделя». */
  const byCell = new Map<string, CellLesson[]>();
  for (const lesson of lessons) {
    for (const week of upcomingWeeks(calendar, lesson, now)) {
      const key = `${lesson.weekday}:${lesson.slotIndex}:${week}`;
      const bucket = byCell.get(key);
      if (bucket) bucket.push({ lesson, week });
      else byCell.set(key, [{ lesson, week }]);
    }
  }

  /* Двойные брони: в одной клетке одной недели не могут сходиться
     один преподаватель, одна аудитория или одна группа. */
  for (const cellLessons of byCell.values()) {
    if (cellLessons.length < 2) continue;
    const { weekday, slotIndex } = cellLessons[0]!.lesson;
    const { week } = cellLessons[0]!;
    const items = cellLessons.map(({ lesson }) => lesson);

    for (const [teacherId, group] of groupBy(items, (lesson) => lesson.teacherId)) {
      if (group.length < 2) continue;
      record(
        {
          type: ConflictType.TeacherDoubleBooked,
          severity: 'error',
          weekday,
          slotIndex,
          focus: { mode: ScheduleViewMode.Teacher, targetId: teacherId },
        },
        group,
        [week],
        (count) =>
          `${teacherName(teachers, teacherId)} — ${pairCountLabel(count)} одновременно (${cellLabel(weekday, slotIndex)})`,
      );
    }

    for (const [roomId, group] of groupBy(items, (lesson) => lesson.roomId)) {
      if (group.length < 2) continue;
      record(
        {
          type: ConflictType.RoomDoubleBooked,
          severity: 'error',
          weekday,
          slotIndex,
          focus: { mode: ScheduleViewMode.Room, targetId: roomId },
        },
        group,
        [week],
        (count) =>
          `Аудитория ${roomName(rooms, roomId)} — ${pairCountLabel(count)} одновременно (${cellLabel(weekday, slotIndex)})`,
      );
    }

    const groupIds = new Set(items.flatMap((lesson) => lesson.groupIds));
    for (const groupId of groupIds) {
      const group = items.filter((lesson) => lesson.groupIds.includes(groupId));
      if (group.length < 2) continue;
      record(
        {
          type: ConflictType.GroupDoubleBooked,
          severity: 'error',
          weekday,
          slotIndex,
          focus: { mode: ScheduleViewMode.Group, targetId: groupId },
        },
        group,
        [week],
        (count) =>
          `Группа ${groupName(studentGroups, groupId)} — ${pairCountLabel(count)} одновременно (${cellLabel(weekday, slotIndex)})`,
      );
    }
  }

  /* Вместимость аудитории меньше численности групп — warning. */
  for (const lesson of lessons) {
    const room = rooms.find(({ id }) => id === lesson.roomId);
    if (!room) continue;
    const groupSize = lesson.groupIds.reduce(
      (total, id) => total + (studentGroups.find((group) => group.id === id)?.size ?? 0),
      0,
    );
    if (room.capacity >= groupSize) continue;

    const weeks = upcomingWeeks(calendar, lesson, now);
    if (!weeks.length) continue;
    record(
      {
        type: ConflictType.RoomCapacity,
        severity: 'warning',
        weekday: lesson.weekday,
        slotIndex: lesson.slotIndex,
        focus: { mode: ScheduleViewMode.Room, targetId: room.id },
      },
      [lesson],
      weeks,
      () =>
        `Вместимость аудитории ${room.name} — ${room.capacity} мест, групп — ${groupSize} человек (${cellLabel(lesson.weekday, lesson.slotIndex)})`,
    );
  }

  const severityRank = (severity: Conflict['severity']) => (severity === 'error' ? 0 : 1);
  return [...found.values()]
    .map(({ base, participants, weeks, count, message }) => ({
      ...base,
      lessonIds: [...participants],
      weeks: [...weeks].sort((left, right) => left - right),
      message: message(count),
    }))
    .sort(
      (left, right) =>
        severityRank(left.severity) - severityRank(right.severity) ||
        left.weekday - right.weekday ||
        left.slotIndex - right.slotIndex ||
        (left.weeks[0] ?? 0) - (right.weeks[0] ?? 0) ||
        left.message.localeCompare(right.message, 'ru'),
    );
}
