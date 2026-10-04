const colors = {
  blue: { background: '#DBEAFE', foreground: '#1D4ED8' },
  indigo: { background: '#E0E7FF', foreground: '#4338CA' },
  violet: { background: '#EDE9FE', foreground: '#6D28D9' },
  pink: { background: '#FCE7F3', foreground: '#BE185D' },
  orange: { background: '#FFEDD5', foreground: '#C2410C' },
  amber: { background: '#FEF3C7', foreground: '#B45309' },
  lime: { background: '#ECFCCB', foreground: '#4D7C0F' },
  green: { background: '#DCFCE7', foreground: '#15803D' },
  teal: { background: '#CCFBF1', foreground: '#0F766E' },
  cyan: { background: '#CFFAFE', foreground: '#0E7490' },
} as const;

export enum Color {
  Blue = 'blue',
  Indigo = 'indigo',
  Violet = 'violet',
  Pink = 'pink',
  Orange = 'orange',
  Amber = 'amber',
  Lime = 'lime',
  Green = 'green',
  Teal = 'teal',
  Cyan = 'cyan',
}

export function resolveColor(color: Color) {
  return colors[color]!;
}

/** Палитра в порядке показа в выборе цвета; цвета не повторяются. */
export const COLOR_OPTIONS: readonly Color[] = [
  Color.Blue,
  Color.Indigo,
  Color.Violet,
  Color.Pink,
  Color.Orange,
  Color.Amber,
  Color.Lime,
  Color.Green,
  Color.Teal,
  Color.Cyan,
];

/** Случайный цвет палитры — для сущностей, созданных без явного цвета. */
export function randomColor(): Color {
  return COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]!;
}
