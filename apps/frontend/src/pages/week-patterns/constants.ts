import { Color } from '@/domain/color.ts';

/** Подписи цветов шаблона недели в выборе «Цвет в календаре». */
export const COLOR_LABELS: Record<Color, string> = {
  [Color.Blue]: 'Синий',
  [Color.Indigo]: 'Индиго',
  [Color.Violet]: 'Фиолетовый',
  [Color.Pink]: 'Розовый',
  [Color.Orange]: 'Оранжевый',
  [Color.Amber]: 'Янтарный',
  [Color.Lime]: 'Лаймовый',
  [Color.Green]: 'Зелёный',
  [Color.Teal]: 'Бирюзовый',
  [Color.Cyan]: 'Голубой',
};

/**
 * Значение пункта «(Выходной)» в выборе шаблона дня. reka-ui Select требует
 * непустую строку, поэтому null кодируется отдельным значением.
 */
export const WEEK_PATTERN_DAY_OFF = '__day-off__';
