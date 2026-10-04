import type { Teacher } from '@/domain/teacher.ts';

import { uuidv4 } from '../utils.ts';

interface TeacherSeed {
  fullName: string;
  position: string;
}

const TEACHERS: TeacherSeed[] = [
  { fullName: 'Иванов Иван Иванович', position: 'Доцент кафедры' },
  { fullName: 'Петров Алексей Владимирович', position: 'Профессор' },
  { fullName: 'Смирнова Галина Дмитриевна', position: 'Старший преподаватель' },
  { fullName: 'Орлов Фёдор Чеславович', position: 'Доцент кафедры' },
  { fullName: 'Кузнецов Пётр Сергеевич', position: 'Ассистент' },
  { fullName: 'Соколова Елена Андреевна', position: 'Доцент кафедры' },
  { fullName: 'Морозов Дмитрий Николаевич', position: 'Заведующий кафедрой' },
  { fullName: 'Волкова Мария Юрьевна', position: 'Старший преподаватель' },
  { fullName: 'Новиков Сергей Павлович', position: 'Профессор' },
  { fullName: 'Фёдорова Анна Константиновна', position: 'Ассистент' },
  { fullName: 'Егоров Виктор Леонидович', position: 'Доцент кафедры' },
  { fullName: 'Павлова Наталья Романовна', position: 'Старший преподаватель' },
];

export function buildTeachers(): Teacher[] {
  return TEACHERS.map(({ fullName, position }) => ({ id: uuidv4(), fullName, position }));
}
