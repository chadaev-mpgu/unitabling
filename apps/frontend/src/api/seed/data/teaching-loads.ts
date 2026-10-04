import type { TeachingLoad } from '@/domain/teaching-load.ts';
import { LessonType } from '@/domain/lesson.ts';

import { uuidv4 } from '../utils.ts';

const LESSON_TYPES: LessonType[] = [LessonType.Lecture, LessonType.Seminar, LessonType.Lab];

export interface TeachingLoadSeedContext {
  /** Проект, которому принадлежат строки. */
  projectId: string;
  disciplineIds: string[];
  teacherIds: string[];
  studentGroupIds: string[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

/**
 * Выбор количества групп в записи с сильным смещением к 1.
 * Вероятности (примерно): 1 группа — 80%, 2 — 15%, 3 — 4%, 4 — 1%.
 */
function pickGroupCount(): number {
  const r = Math.random();
  if (r < 0.8) return 1;
  if (r < 0.95) return 2;
  if (r < 0.99) return 3;
  return 4;
}

/**
 * Часы: нормальное распределение (Box-Muller) вокруг 32,
 * обрезанное до [16, 72] и округлённое до кратного 2 (учебные пары).
 */
function pickHours(): number {
  let h: number;
  do {
    const u1 = Math.random() || 1e-9;
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    h = Math.round((32 + z * 10) / 2) * 2; // среднее 32, σ ≈ 10
  } while (h < 16 || h > 72);
  return h;
}

/** Уникальный набор из n id студенческих групп */
function pickGroups(groupIds: string[], n: number): string[] {
  const pool = [...groupIds];
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const idx = randInt(0, pool.length - 1);
    result.push(pool.splice(idx, 1)[0]!);
  }
  return result.sort();
}

/** Генерирует строки нагрузки, ссылаясь на уже персистентные id справочников. */
export function buildTeachingLoads(
  count: number,
  { projectId, disciplineIds, teacherIds, studentGroupIds }: TeachingLoadSeedContext,
): TeachingLoad[] {
  const result: TeachingLoad[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 50;

  while (result.length < count && attempts < maxAttempts) {
    attempts++;

    const teacherId = pick(teacherIds);
    const disciplineId = pick(disciplineIds);
    const groupCount = pickGroupCount();
    const groupIds = pickGroups(studentGroupIds, groupCount);
    const lessonType = pick(LESSON_TYPES);

    // ключ уникальности: teacherId + отсортированные groupIds + disciplineId + lessonType
    const key = [teacherId, groupIds.join('|'), disciplineId, lessonType].join('::');
    if (seen.has(key)) continue; // в реальном проекте такие записи суммируются

    seen.add(key);

    result.push({
      id: uuidv4(),
      projectId,
      disciplineId,
      teacherId,
      groupIds,
      lessonType,
      hoursTotal: pickHours(),
    });
  }

  return result;
}
