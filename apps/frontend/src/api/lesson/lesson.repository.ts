import type { AcademicCalendar } from '@/domain/academic-calendar.ts';
import {
  firstFutureWeek,
  hasPastOccurrences,
  splitLesson,
  type OccurrenceRule,
} from '@/domain/occurrence.ts';
import type { CreateLessonRequest, Lesson, UpdateLessonRequest } from '@/domain/lesson.ts';
import { weekBounds, type WeekRange } from '@/domain/week.ts';
import { uuidv4 } from '@/lib/uuid.ts';

import { createRepository } from '../repository.ts';
import { getProjectCalendar } from '../schedule-project/schedule-project.repository.ts';

export const lessonRepository = createRepository<Lesson>('lessons');

interface NormalizedLessons {
  lessons: Lesson[];
  /** id зафиксированного прошедшего фрагмента → id его будущего остатка. */
  remainderByFixedId: Map<string, string>;
}

/**
 * Дробление частично прошедших уроков при чтении/записи
 * (docs/data-model/time-mechanics.md). Идемпотентно: после дробления все
 * фрагменты либо целиком в прошлом, либо без прошедших вхождений.
 */
function normalize(now: Date): NormalizedLessons {
  const lessons = lessonRepository.list();
  const remainderByFixedId = new Map<string, string>();
  const next: Lesson[] = [];
  let changed = false;

  for (const lesson of lessons) {
    const split = splitLesson(lesson, getProjectCalendar(lesson.projectId), now);
    if (!split) {
      next.push(lesson);
      continue;
    }

    changed = true;
    next.push(split.fixed);
    if (split.remainder) {
      const remainder: Lesson = { id: uuidv4(), ...split.remainder };
      remainderByFixedId.set(split.fixed.id, remainder.id);
      next.push(remainder);
    }
  }

  if (changed) lessonRepository.replaceAll(next);
  return { lessons: next, remainderByFixedId };
}

/** Диапазон запроса, обрезанный по будущим неделям: прошедшие не назначаем. */
function trimToFuture(
  range: WeekRange | undefined,
  rule: OccurrenceRule,
  now: Date,
  calendar: AcademicCalendar,
): WeekRange | undefined {
  const bounds = weekBounds(range, calendar.weeks);
  const firstFuture = firstFutureWeek(calendar, { ...rule, weekRange: bounds }, now);
  const from = Math.max(bounds.from, firstFuture ?? bounds.to + 1);
  if (from > bounds.to) {
    throw new Error('[api] в выбранном диапазоне нет будущих недель — прошедшие назначить нельзя');
  }

  // «Не установлена — все недели календаря» остаётся дефолтом, пока
  // прошедших недель нет.
  if (range === undefined && from === 1) return undefined;
  return { from, to: bounds.to };
}

/** Читает уроки всех проектов, дробя частично прошедшие. */
export function list(): Lesson[] {
  return normalize(new Date()).lessons;
}

/**
 * Сохраняет урок и возвращает его с присвоенным id; прошедшие недели
 * диапазона отрезаются. Асинхронная сигнатура — задел на будущий запрос
 * к серверу.
 */
export async function save(request: CreateLessonRequest): Promise<Lesson> {
  const now = new Date();
  const { lessons } = normalize(now);
  const weekRange = trimToFuture(
    request.weekRange,
    request,
    now,
    getProjectCalendar(request.projectId),
  );
  const lesson: Lesson = { id: uuidv4(), ...request, weekRange };
  lessons.push(lesson);
  lessonRepository.replaceAll(lessons);
  return lesson;
}

/**
 * Применяет правки к уроку. Если урок успел частично уйти в прошлое,
 * сервер дробит его: правка уходит будущему остатку, прошедшая часть
 * фиксируется. Правка зафиксированной части запрещена.
 */
export async function update(request: UpdateLessonRequest): Promise<Lesson> {
  const now = new Date();
  const { lessons, remainderByFixedId } = normalize(now);

  const stored = lessons.find(({ id }) => id === request.id);
  if (!stored) {
    throw new Error(`[api] урок «${request.id}» не найден`);
  }

  // Часы пересекли границу слота, пока урок правили: правим остаток.
  let target = stored;
  if (hasPastOccurrences(getProjectCalendar(stored.projectId), stored, now)) {
    const remainderId = remainderByFixedId.get(stored.id);
    if (!remainderId) {
      throw new Error('[api] прошедшее занятие нельзя изменить');
    }
    target = lessons.find(({ id }) => id === remainderId)!;
  }

  const weekRange = trimToFuture(
    request.weekRange,
    target,
    now,
    getProjectCalendar(target.projectId),
  );
  const index = lessons.findIndex(({ id }) => id === target.id);
  const updated: Lesson = {
    ...target,
    roomId: request.roomId,
    teacherId: request.teacherId,
    parity: request.parity,
    weekRange,
  };
  lessons[index] = updated;
  lessonRepository.replaceAll(lessons);
  return updated;
}

/** Удаляет урок; проведённые вхождения удалять нельзя. */
export async function remove(id: string): Promise<void> {
  const now = new Date();
  const { lessons } = normalize(now);
  const index = lessons.findIndex((lesson) => lesson.id === id);
  if (index === -1) {
    throw new Error(`[api] урок «${id}» не найден`);
  }
  if (hasPastOccurrences(getProjectCalendar(lessons[index]!.projectId), lessons[index]!, now)) {
    throw new Error('[api] прошедшее занятие нельзя удалить');
  }

  lessons.splice(index, 1);
  lessonRepository.replaceAll(lessons);
}
