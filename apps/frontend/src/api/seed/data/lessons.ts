import type { Lesson } from '@/domain/lesson.ts';
import type { Room } from '@/domain/room.ts';
import type { StudentGroup } from '@/domain/student-group.ts';
import type { TeachingLoad } from '@/domain/teaching-load.ts';
import { Weekday, WeekParity } from '@/domain/week.ts';

import { uuidv4 } from '../utils.ts';

export interface LessonSeedContext {
  /** Персистентные строки нагрузки: дисциплина, группы и преподаватель занятия. */
  loads: TeachingLoad[];
  rooms: Room[];
  studentGroups: StudentGroup[];
}

/** Наименьшее число строк нагрузки, при котором хватает на все демо-занятия. */
const REQUIRED_LOADS = 5;

/** Строки, между которыми не бывает пересечения состава групп. */
function groupsDisjoint(left: TeachingLoad, right: TeachingLoad): boolean {
  return !left.groupIds.some((id) => right.groupIds.includes(id));
}

/**
 * Первая пара неиспользованных строк из пула, подходящая под условие;
 * выбранные строки помечаются использованными, чтобы демо-занятия
 * не пересекались между собой.
 */
function takePair(
  pool: TeachingLoad[],
  used: Set<string>,
  match: (left: TeachingLoad, right: TeachingLoad) => boolean,
): [TeachingLoad, TeachingLoad] | null {
  for (let i = 0; i < pool.length; i++) {
    const left = pool[i]!;
    if (used.has(left.id)) continue;

    for (let j = i + 1; j < pool.length; j++) {
      const right = pool[j]!;
      if (used.has(right.id)) continue;
      if (!match(left, right)) continue;

      used.add(left.id);
      used.add(right.id);
      return [left, right];
    }
  }
  return null;
}

/** Занятие строки нагрузки: без диапазона — все недели календаря. */
function lesson(
  load: TeachingLoad,
  roomId: string,
  weekday: Weekday,
  slotIndex: number,
  teacherId = load.teacherId ?? '',
): Lesson {
  return {
    id: uuidv4(),
    projectId: load.projectId,
    teachingLoadId: load.id,
    teacherId,
    roomId,
    groupIds: [...load.groupIds],
    weekday,
    slotIndex,
    parity: WeekParity.Both,
  };
}

/**
 * Демо-занятия для нижнего дока конфликтов: гарантируют по одному конфликту
 * каждого вида (docs/data-model/conflicts.md) — двойную бронь преподавателя
 * и аудитории (error) и вместимость аудитории (warning). Занятия стоят
 * во всех неделях календаря, поэтому конфликт виден в любом периоде.
 */
export function buildLessons({ loads, rooms, studentGroups }: LessonSeedContext): Lesson[] {
  if (loads.length < REQUIRED_LOADS) return [];

  // Аудитории под группы по 30 человек — по одной на демо-занятие.
  const spacious = rooms.filter(({ capacity }) => capacity >= 30);
  const smallest = [...rooms].sort((left, right) => left.capacity - right.capacity)[0];
  if (spacious.length < 3 || !smallest) return [];

  const used = new Set<string>();
  const result: Lesson[] = [];
  /** Демо берут нагрузки с одной группой: вместимость больших аудиторий не превышается. */
  const singleGroup = (load: TeachingLoad) => load.groupIds.length === 1;
  const groupSize = (load: TeachingLoad) =>
    load.groupIds.reduce(
      (total, id) => total + (studentGroups.find((group) => group.id === id)?.size ?? 0),
      0,
    );

  // 1. Преподаватель ведёт две пары одновременно: занятия разных нагрузок,
  //    разные аудитории и непересекающиеся группы — конфликтует только он.
  const teacherPair = takePair(
    loads,
    used,
    (left, right) =>
      Boolean(left.teacherId && right.teacherId) &&
      singleGroup(left) &&
      singleGroup(right) &&
      groupsDisjoint(left, right),
  );
  if (teacherPair) {
    const [first, second] = teacherPair;
    result.push(
      lesson(first, spacious[0]!.id, Weekday.Tuesday, 3),
      lesson(second, spacious[1]!.id, Weekday.Tuesday, 3, first.teacherId),
    );
  }

  // 2. Две пары в одной аудитории: разные преподаватели и группы.
  const roomPair = takePair(
    loads,
    used,
    (left, right) =>
      Boolean(left.teacherId && right.teacherId) &&
      left.teacherId !== right.teacherId &&
      singleGroup(left) &&
      singleGroup(right) &&
      groupsDisjoint(left, right),
  );
  if (roomPair) {
    const [first, second] = roomPair;
    result.push(
      lesson(first, spacious[2]!.id, Weekday.Wednesday, 3),
      lesson(second, spacious[2]!.id, Weekday.Wednesday, 3),
    );
  }

  // 3. Вместимость аудитории меньше численности групп — warning.
  const capacityLoad = loads.find(
    (load) => !used.has(load.id) && groupSize(load) > smallest.capacity,
  );
  if (capacityLoad) {
    used.add(capacityLoad.id);
    result.push(lesson(capacityLoad, smallest.id, Weekday.Thursday, 2));
  }

  return result;
}
