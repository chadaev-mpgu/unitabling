import { defineStore } from 'pinia';
import { ref } from 'vue';

import { listLessons, teacherRepository, teachingLoadRepository } from '@/api/index.ts';
import type { Teacher } from '@/domain/teacher.ts';

/** Ссылки на преподавателя: объекты, которые не дают его удалить (UC-2.1). */
export interface TeacherReferences {
  loads: number;
  lessons: number;
  total: number;
}

/** Глобальный справочник преподавателей — общий для всех проектов. */
export const useTeacherStore = defineStore('teacher', () => {
  const teachers = ref<Teacher[]>(teacherRepository.list());

  function refresh(): void {
    teachers.value = teacherRepository.list();
  }

  /** Считает ссылки из нагрузок и занятий любого проекта. */
  function teacherReferences(id: string): TeacherReferences {
    const loads = teachingLoadRepository.list().filter((load) => load.teacherId === id).length;
    const lessons = listLessons().filter((lesson) => lesson.teacherId === id).length;
    return { loads, lessons, total: loads + lessons };
  }

  /** Создаёт преподавателя; id присваивает «сервер». */
  async function addTeacher(request: Omit<Teacher, 'id'>): Promise<Teacher> {
    const teacher = teacherRepository.create(request);
    refresh();
    return teacher;
  }

  /** Сохраняет правки карточки преподавателя. */
  async function editTeacher(teacher: Teacher): Promise<void> {
    teacherRepository.update(teacher);
    refresh();
  }

  /** Удаляет преподавателя, только если на него никто не ссылается. */
  async function removeTeacher(id: string): Promise<void> {
    const references = teacherReferences(id);
    if (references.total > 0) {
      throw new Error('Нельзя удалить: на преподавателя ссылаются нагрузка или занятие');
    }
    teacherRepository.remove(id);
    refresh();
  }

  return { teachers, teacherReferences, addTeacher, editTeacher, removeTeacher };
});
