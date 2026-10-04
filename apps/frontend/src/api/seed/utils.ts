import { Color } from '@/domain/color.ts';

export { uuidv4 } from '@/lib/uuid.ts';

/** Стабильный цвет сущности по её имени — чтобы сиды выглядели одинаково. */
export function getDeterministicColor(id: string): Color {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const key = Math.abs(hash) % Object.keys(Color).length;
  return Object.values(Color)[key]!;
}
