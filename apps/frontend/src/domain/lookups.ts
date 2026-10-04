import type { Discipline } from './discipline.ts';
import type { Room } from './room.ts';
import type { StudentGroup } from './student-group.ts';
import type { Teacher } from './teacher.ts';

/**
 * Разрешение ссылок по id. Справочники передаются явно, чтобы функции
 * оставались чистыми. Если ссылка битая, label-функции возвращают сам id.
 */

export function findDiscipline(disciplines: Discipline[], id: string): Discipline | undefined {
  return disciplines.find((discipline) => discipline.id === id);
}

export function findRoom(rooms: Room[], id: string): Room | undefined {
  return rooms.find((room) => room.id === id);
}

export function findTeacher(teachers: Teacher[], id: string): Teacher | undefined {
  return teachers.find((teacher) => teacher.id === id);
}

export function findStudentGroup(groups: StudentGroup[], id: string): StudentGroup | undefined {
  return groups.find((group) => group.id === id);
}

export function disciplineName(disciplines: Discipline[], id: string): string {
  return findDiscipline(disciplines, id)?.name ?? id;
}

export function teacherName(teachers: Teacher[], id: string): string {
  return findTeacher(teachers, id)?.fullName ?? id;
}

/**
 * Сокращённое Ф. И. О.: «Иванов Иван Иванович» → «Иванов И. И.». Одно слово
 * (или битая ссылка — id) возвращается как есть.
 */
export function abbreviateName(fullName: string): string {
  const [surname, ...rest] = fullName.trim().split(/\s+/);
  if (!surname) return fullName;
  const initials = rest.map((part) => `${part[0]?.toUpperCase() ?? ''}.`).join(' ');
  return initials ? `${surname} ${initials}` : surname;
}

/** Сокращённое Ф. И. О. преподавателя по id. */
export function teacherShortName(teachers: Teacher[], id: string): string {
  const teacher = findTeacher(teachers, id);
  return teacher ? abbreviateName(teacher.fullName) : id;
}

export function roomName(rooms: Room[], id: string): string {
  return findRoom(rooms, id)?.name ?? id;
}

export function groupName(groups: StudentGroup[], id: string): string {
  return findStudentGroup(groups, id)?.name ?? id;
}
