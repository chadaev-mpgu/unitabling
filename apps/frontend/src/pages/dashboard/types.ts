import type { LucideIcon } from '@lucide/vue';

/** Тон значения плитки: обычный, внимание (warning) или ошибка. */
export type DashboardTileTone = 'default' | 'attention' | 'destructive';

/** Плитка показателя панели управления. */
export interface DashboardTile {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: DashboardTileTone;
}

/** Раздел плиток — «Текущий проект» и «Справочники». */
export interface DashboardTileSection {
  key: string;
  title: string;
  tiles: DashboardTile[];
}

/** Период календаря текущего проекта — сведения в карточке настроек. */
export interface DashboardPeriodInfo {
  /** Первый день первой недели, «7 сентября 2026». */
  start: string;
  /** Последний день последней недели. */
  end: string;
  weeks: number;
  /** Номер недели, содержащей текущую дату; null — вне календаря. */
  currentWeek: number | null;
}
