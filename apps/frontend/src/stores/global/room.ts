import { defineStore } from 'pinia';
import { ref } from 'vue';

import { listLessons, roomRepository } from '@/api/index.ts';
import type { Room } from '@/domain/room.ts';

/** Ссылки на аудиторию: занятия, которые не дают её удалить (UC-2.2). */
export interface RoomReferences {
  lessons: number;
  total: number;
}

/** Глобальный справочник аудиторий — общий для всех проектов. */
export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>(roomRepository.list());

  function refresh(): void {
    rooms.value = roomRepository.list();
  }

  /** Считает ссылки из занятий любого проекта. */
  function roomReferences(id: string): RoomReferences {
    const lessons = listLessons().filter((lesson) => lesson.roomId === id).length;
    return { lessons, total: lessons };
  }

  /** Создаёт аудиторию; id присваивает «сервер». */
  async function addRoom(request: Omit<Room, 'id'>): Promise<Room> {
    const room = roomRepository.create(request);
    refresh();
    return room;
  }

  /** Сохраняет правки карточки аудитории. */
  async function editRoom(room: Room): Promise<void> {
    roomRepository.update(room);
    refresh();
  }

  /** Удаляет аудиторию, только если на неё не ссылается ни одно занятие. */
  async function removeRoom(id: string): Promise<void> {
    const references = roomReferences(id);
    if (references.total > 0) {
      throw new Error('Нельзя удалить: на аудиторию ссылается занятие');
    }
    roomRepository.remove(id);
    refresh();
  }

  return { rooms, roomReferences, addRoom, editRoom, removeRoom };
});
