export type RoomKind = 'lecture' | 'lab' | 'computer' | 'gym' | 'other';

export interface Room {
  id: string;
  name: string; // "305"
  capacity: number;
  kind: RoomKind;
}

const capacityFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Вместимость с подписью и склонением: 30 → «30 мест», 21 → «21 место». */
export function formatCapacity(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  const unit =
    mod10 === 1 && mod100 !== 11
      ? 'место'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'места'
        : 'мест';
  return `${capacityFormat.format(value)} ${unit}`;
}
