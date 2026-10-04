import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { deleteLesson, listLessons, saveLesson, updateLesson } from '@/api/index.ts';
import type { CreateLessonRequest, Lesson, UpdateLessonRequest } from '@/domain/lesson.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';

/** Уроки текущего проекта: правило, которое разворачивается во вхождения. */
export const useLessonStore = defineStore('lesson', () => {
  const projectStore = useScheduleProjectStore();
  const lessons = ref<Lesson[]>([]);

  /**
   * Перечитывает уроки текущего проекта: сервер мог раздробить их
   * на прошедшую и будущую части.
   */
  function refresh(): void {
    const projectId = projectStore.currentProjectId;
    lessons.value = projectId
      ? listLessons().filter((lesson) => lesson.projectId === projectId)
      : [];
  }

  // Смена проекта меняет набор уроков; единого слоя подписок в проекте нет.
  watch(() => projectStore.currentProjectId, refresh, { immediate: true });

  /** Сохраняет урок в мок-бэкенде и кладёт его в состояние. */
  async function addLesson(request: CreateLessonRequest): Promise<Lesson> {
    const lesson = await saveLesson(request);
    refresh();
    return lesson;
  }

  /** Применяет правки к уроку; прошедшую часть сервер фиксирует сам. */
  async function editLesson(request: UpdateLessonRequest): Promise<Lesson> {
    const saved = await updateLesson(request);
    refresh();
    return saved;
  }

  /** Удаляет урок из мок-бэкенда и состояния. */
  async function removeLesson(id: string): Promise<void> {
    if (!lessons.value.some((lesson) => lesson.id === id)) return;
    await deleteLesson(id);
    refresh();
  }

  return { lessons, addLesson, editLesson, removeLesson };
});
