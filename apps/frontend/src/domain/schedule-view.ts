import { Color } from './color.ts';
import { isFullyPast, lessonPeriodParity } from './occurrence.ts';
import { parityMatches, weekBounds, WeekParity, type Weekday, type WeekRange } from './week.ts';

import type { AcademicCalendar } from './academic-calendar.ts';
import type { Discipline } from './discipline.ts';
import type { Lesson } from './lesson.ts';
import { findDiscipline, roomName, teacherShortName } from './lookups.ts';
import type { Room } from './room.ts';
import type { Teacher } from './teacher.ts';
import type { TeachingLoad } from './teaching-load.ts';

/** Занятие в сетке расписания — денормализованный view-model. */
export interface ScheduleLesson {
  /** Устойчивый идентификатор занятия. */
  id: string;
  /** Ключ дня недели (`ScheduleDay.key`). */
  day: Weekday;
  /** Ключ пары (`ScheduleSlot.id`). */
  slotId: string | number;
  /** `Above` — верхняя половина клетки, `Below` — нижняя, `Both` — вся клетка. */
  parity: WeekParity;
  /**
   * Парность для отрисовки: где занятие реально проходит в неделях периода
   * (`Both` — только если вхождения есть в обеих неделях пары), чтобы не
   * показывать клетку целиком, если урок идёт только в одной неделе.
   */
  displayParity: WeekParity;
  /** Название дисциплины. */
  subject: string;
  /** Преподаватель. */
  teacher?: string;
  /** Аудитория. */
  room?: string;
  /** Цвет карточки из палитры расписания. */
  color?: Color;
  /** `error`-конфликт: карточка получает красную рамку и значок предупреждения. */
  warning?: boolean;
  /** Все вхождения урока уже прошли: карточка — история, правка недоступна. */
  locked: boolean;
}

export interface ScheduleViewContext {
  lessons: Lesson[];
  loads: TeachingLoad[];
  disciplines: Discipline[];
  teachers: Teacher[];
  rooms: Room[];
  calendar: AcademicCalendar;
  /** Отображаемый период — недели, по которым считается отрисовка занятий. */
  period: WeekRange;
  now: Date;
  /** Уроки с `error`-конфликтами: карточка помечается предупреждением. */
  errorLessonIds?: ReadonlySet<string>;
}

/** Режим просмотра расписания. */
export const enum ScheduleViewMode {
  Group = 'group',
  Teacher = 'teacher',
  Room = 'room',
}

/** Выбранная сущность вида; `targetId: null` — фильтр выключен. */
export interface ScheduleView {
  mode: ScheduleViewMode;
  targetId: string | null;
}

/**
 * Попадает ли занятие в вид. Группа проверяется по составу урока
 * (`lesson.groupIds`), а не по нагрузке: поток виден в виде каждой своей группы.
 */
export function lessonMatchesView(
  lesson: Pick<Lesson, 'groupIds' | 'teacherId' | 'roomId'>,
  view: ScheduleView,
): boolean {
  if (!view.targetId) return true;
  if (view.mode === ScheduleViewMode.Group) return lesson.groupIds.includes(view.targetId);
  if (view.mode === ScheduleViewMode.Teacher) return lesson.teacherId === view.targetId;
  return lesson.roomId === view.targetId;
}

/**
 * Попадает ли строка нагрузки в вид. Аудитории в строке нет, поэтому
 * в виде по аудитории подходят все строки.
 */
export function loadMatchesView(
  load: Pick<TeachingLoad, 'groupIds' | 'teacherId'>,
  view: ScheduleView,
): boolean {
  if (!view.targetId) return true;
  if (view.mode === ScheduleViewMode.Group) return load.groupIds.includes(view.targetId);
  if (view.mode === ScheduleViewMode.Teacher) return load.teacherId === view.targetId;
  return true;
}

/** Диапазон недель урока пересекает период (парность не учитывается). */
export function lessonOverlapsPeriod(
  lesson: Pick<Lesson, 'weekRange'>,
  period: WeekRange,
  weekCount: number,
): boolean {
  const { from, to } = weekBounds(lesson.weekRange, weekCount);
  return Math.max(from, period.from) <= Math.min(to, period.to);
}

/** В уроке есть вхождение хотя бы в одной неделе периода. */
export function lessonOccursInPeriod(
  lesson: Pick<Lesson, 'parity' | 'weekRange'>,
  period: WeekRange,
  weekCount: number,
): boolean {
  const { from, to } = weekBounds(lesson.weekRange, weekCount);
  const last = Math.min(to, period.to);
  for (let index = Math.max(from, period.from); index <= last; index++) {
    if (parityMatches(lesson.parity, index)) return true;
  }
  return false;
}

/** Разворачивает уроки в карточки сетки, подставляя названия из справочников. */
export function buildScheduleLessons({
  lessons,
  loads,
  disciplines,
  teachers,
  rooms,
  calendar,
  period,
  now,
  errorLessonIds,
}: ScheduleViewContext): ScheduleLesson[] {
  return lessons.map((lesson) => {
    const { id, weekday, slotIndex, parity, teachingLoadId, roomId, teacherId } = lesson;
    const load = loads.find((item) => item.id === teachingLoadId);
    const discipline = load ? findDiscipline(disciplines, load.disciplineId) : undefined;

    return {
      id,
      day: weekday,
      slotId: slotIndex,
      parity,
      displayParity: lessonPeriodParity(calendar, lesson, period) ?? parity,
      subject: discipline?.name ?? 'Без дисциплины',
      teacher: teacherShortName(teachers, teacherId),
      room: roomName(rooms, roomId),
      color: discipline?.color ?? Color.Blue,
      warning: errorLessonIds?.has(id) ?? false,
      locked: isFullyPast(calendar, lesson, now),
    };
  });
}

/** Раскладка занятий клетки «день × пара» по позициям парности. */
export interface ScheduleCellLayout<T> {
  /** `Both` — занимают клетку целиком. */
  full: T[];
  /** `Above` — верхняя половина (нечётные недели). */
  above: T[];
  /** `Below` — нижняя половина (чётные недели). */
  below: T[];
  /** Парности, допустимые для нового занятия; пустой список — в клетке нет места. */
  allowed: WeekParity[];
}

/**
 * Раскладывает занятия клетки по позициям парности: в клетке максимум два
 * занятия — Above (сверху) и Below (снизу); Both занимает клетку целиком
 * и исключает второе. Неизвестная парность (старые данные) трактуется как
 * Both, чтобы аномальный урок не потерялся и не притворился половиной.
 */
export function buildScheduleCellLayout<T extends { parity: WeekParity }>(
  lessons: readonly T[],
): ScheduleCellLayout<T> {
  const layout: ScheduleCellLayout<T> = { full: [], above: [], below: [], allowed: [] };

  for (const lesson of lessons) {
    if (lesson.parity === WeekParity.Above) layout.above.push(lesson);
    else if (lesson.parity === WeekParity.Below) layout.below.push(lesson);
    else layout.full.push(lesson);
  }

  if (!layout.full.length) {
    if (!layout.above.length) layout.allowed.push(WeekParity.Above);
    if (!layout.below.length) layout.allowed.push(WeekParity.Below);
    // Both возможен, только пока клетка пуста.
    if (layout.allowed.length === 2) layout.allowed.push(WeekParity.Both);
  }

  return layout;
}
