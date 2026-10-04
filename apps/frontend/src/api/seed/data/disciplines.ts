import type { Discipline } from '@/domain/discipline.ts';

import { getDeterministicColor, uuidv4 } from '../utils.ts';

const DISCIPLINES = [
  'Математический анализ',
  'Линейная алгебра',
  'Дискретная математика',
  'Информатика',
  'Программирование',
  'Алгоритмы и структуры данных',
  'Базы данных',
  'Операционные системы',
  'Архитектура ЭВМ',
  'Компьютерные сети',
  'Теория вероятностей и математическая статистика',
  'Физика',
  'Электротехника',
  'Схемотехника',
  'Теория автоматов',
  'Компиляторные технологии',
  'Искусственный интеллект',
  'Машинное обучение',
  'Компьютерная графика',
  'Защита информации',
];

export function buildDisciplines(): Discipline[] {
  return DISCIPLINES.map((name) => ({ id: uuidv4(), name, color: getDeterministicColor(name) }));
}
