export interface Teacher {
  id: string;
  fullName: string;
  /** Должность в справочнике; фильтр страницы преподавателей. */
  position?: string;
}
