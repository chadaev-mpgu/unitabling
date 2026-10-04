import type { Room, RoomKind } from './room.ts';

/** Sentinel «без ограничения» для селектов фильтра. */
export const ROOM_FILTER_ALL = 'all';

/** Совмещаемые фильтры таблицы аудиторий (UC-2.2). */
export interface RoomFilter {
  kind: string;
  capacity: string;
}

/** Опция фильтра вместимости: включительные границы, если заданы. */
export interface RoomCapacityOption {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

/** Варианты фильтра вместимости — от «всех» к «более 50 человек». */
export const ROOM_CAPACITY_OPTIONS: readonly RoomCapacityOption[] = [
  { value: ROOM_FILTER_ALL, label: 'Все' },
  { value: 'up-to-15', label: 'До 15 человек', max: 15 },
  { value: 'up-to-30', label: 'До 30 человек', max: 30 },
  { value: 'up-to-50', label: 'До 50 человек', max: 50 },
  { value: 'over-50', label: 'Более 50 человек', min: 51 },
];

/** Сводка по (отфильтрованным) аудиториям: всего и по видам. */
export interface RoomStats {
  total: number;
  byKind: Record<RoomKind, number>;
}

/** Проверяет вместимость по границам выбранного варианта фильтра. */
function matchesCapacity(capacity: number, bucket: string): boolean {
  const option = ROOM_CAPACITY_OPTIONS.find((item) => item.value === bucket);
  if (!option) return true;
  if (option.min !== undefined && capacity < option.min) return false;
  if (option.max !== undefined && capacity > option.max) return false;
  return true;
}

/** Отбор по виду и вместимости; «все» пропускает без проверки. */
export function filterRooms(rooms: Room[], filter: RoomFilter): Room[] {
  return rooms.filter((room) => {
    if (filter.kind !== ROOM_FILTER_ALL && room.kind !== filter.kind) return false;
    return matchesCapacity(room.capacity, filter.capacity);
  });
}

/** Сводка считается по отфильтрованным аудиториям — как в макете. */
export function buildRoomStats(rooms: Room[]): RoomStats {
  const byKind: Record<RoomKind, number> = {
    lecture: 0,
    lab: 0,
    computer: 0,
    gym: 0,
    other: 0,
  };
  for (const room of rooms) byKind[room.kind] += 1;
  return { total: rooms.length, byKind };
}
