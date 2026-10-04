import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { listLessons, teachingLoadRepository } from '@/api/index.ts';
import {
  isStream,
  type CreateTeachingLoadRequest,
  type TeachingLoad,
} from '@/domain/teaching-load.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';

/** Учебная нагрузка текущего проекта — «задача на расстановку». */
export const useTeachingLoadStore = defineStore('teaching-load', () => {
  const projectStore = useScheduleProjectStore();
  const loads = ref<TeachingLoad[]>([]);

  /** Перечитывает строки текущего проекта: слияние и разбор меняют состав. */
  function refresh(): void {
    const projectId = projectStore.currentProjectId;
    loads.value = projectId
      ? teachingLoadRepository.list().filter((load) => load.projectId === projectId)
      : [];
  }

  // Смена проекта меняет набор строк; единого слоя подписок в проекте нет.
  watch(() => projectStore.currentProjectId, refresh, { immediate: true });

  /** Сколько занятий ссылается на строку: запрет удаления и разбора (UC-3.4, UC-5.5). */
  function lessonCount(loadId: string): number {
    return listLessons().filter((lesson) => lesson.teachingLoadId === loadId).length;
  }

  /** Создаёт строку нагрузки; id присваивает «сервер». */
  async function addLoad(request: CreateTeachingLoadRequest): Promise<TeachingLoad> {
    const load = teachingLoadRepository.create(request);
    refresh();
    return load;
  }

  /**
   * Назначает или меняет преподавателя — единственное изменяемое поле
   * строки (UC-3.3). `undefined` снимает назначение.
   */
  async function assignTeacher(loadId: string, teacherId?: string): Promise<void> {
    const load = loads.value.find(({ id }) => id === loadId);
    if (!load) return;
    if (teacherId) load.teacherId = teacherId;
    else delete load.teacherId;
    teachingLoadRepository.update(load);
    refresh();
  }

  /** Удаляет строку, только если на неё не ссылается ни один урок (UC-3.4). */
  async function removeLoad(loadId: string): Promise<void> {
    if (lessonCount(loadId) > 0) {
      throw new Error('Нельзя удалить: на строку ссылаются занятия');
    }
    teachingLoadRepository.remove(loadId);
    refresh();
  }

  /**
   * Объединяет строки в поток (UC-5.1): создаёт строку-поток с объединёнными
   * группами, вычитает её часы из каждой исходной строки и удаляет исходную
   * строку, только если после вычитания в ней не осталось часов и занятий.
   */
  async function mergeIntoStream(loadIds: string[], hours: number): Promise<TeachingLoad> {
    const sources = loads.value.filter((load) => loadIds.includes(load.id));
    if (sources.length < 2) {
      throw new Error('Для объединения в поток нужно минимум две строки');
    }

    const groupIds = streamGroupIdsOf(sources);
    // Поток берёт назначенного преподавателя (UC-5.1).
    const teacherId = sources.find((load) => load.teacherId)?.teacherId;

    const stream = teachingLoadRepository.create({
      projectId: sources[0]!.projectId,
      disciplineId: sources[0]!.disciplineId,
      teacherId,
      groupIds,
      lessonType: sources[0]!.lessonType,
      hoursTotal: hours,
    });

    for (const source of sources) {
      const next: TeachingLoad = { ...source, hoursTotal: source.hoursTotal - hours };
      // Часы вернулись в поток целиком и занятий нет — строка больше не нужна.
      // Иначе остаток (в том числе превышение над часами потока) остаётся.
      if (next.hoursTotal <= 0 && lessonCount(source.id) === 0) {
        teachingLoadRepository.remove(source.id);
      } else {
        teachingLoadRepository.update(next);
      }
    }

    refresh();
    return stream;
  }

  /**
   * Разбирает поток без занятий (UC-5.5): часы возвращаются per-group
   * строкам — существующие дополняются, удалённые создаются заново.
   */
  async function splitStream(loadId: string): Promise<void> {
    const stream = loads.value.find(({ id }) => id === loadId);
    if (!stream || !isStream(stream)) return;
    if (lessonCount(stream.id) > 0) {
      throw new Error('Поток с занятиями разобрать нельзя');
    }

    for (const groupId of stream.groupIds) {
      const existing = loads.value.find(
        (load) =>
          load.id !== stream.id &&
          load.disciplineId === stream.disciplineId &&
          load.lessonType === stream.lessonType &&
          load.groupIds.length === 1 &&
          load.groupIds[0] === groupId &&
          load.teacherId === stream.teacherId,
      );
      if (existing) {
        teachingLoadRepository.update({
          ...existing,
          hoursTotal: existing.hoursTotal + stream.hoursTotal,
        });
      } else {
        teachingLoadRepository.create({
          projectId: stream.projectId,
          disciplineId: stream.disciplineId,
          teacherId: stream.teacherId,
          groupIds: [groupId],
          lessonType: stream.lessonType,
          hoursTotal: stream.hoursTotal,
        });
      }
    }

    teachingLoadRepository.remove(stream.id);
    refresh();
  }

  return { loads, lessonCount, addLoad, assignTeacher, removeLoad, mergeIntoStream, splitStream };
});

/** Группы строк без повторов — состав будущего потока. */
function streamGroupIdsOf(loads: TeachingLoad[]): string[] {
  const ids: string[] = [];
  for (const load of loads) {
    for (const id of load.groupIds) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}
