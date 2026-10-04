import type { RoomKind } from '@/domain/room.ts';

/** Виды аудиторий в порядке показа; используется фильтром и формой. */
export const ROOM_KIND_OPTIONS: readonly RoomKind[] = [
  'lecture',
  'lab',
  'computer',
  'gym',
  'other',
];

/** Подписи видов аудиторий в таблице: «Лекционная», «Спортзал». */
export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  lecture: 'Лекционная',
  lab: 'Лаборатория',
  computer: 'Компьютерная',
  gym: 'Спортзал',
  other: 'Другая',
};

/** Подписи сводки по видам — множественное число, как в макете. */
export const ROOM_KIND_SUMMARY_LABELS: Record<RoomKind, string> = {
  lecture: 'Лекционных',
  lab: 'Лабораторий',
  computer: 'Компьютерных',
  gym: 'Спортзалов',
  other: 'Прочих',
};
