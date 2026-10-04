# Модель данных

Типизированное описание (TypeScript) — ниже. Детализация сущностей,
инвариантов и расчётных правил — в файлах этого раздела.

```typescript
type ID = string;

enum Weekday { Monday = 1, Tuesday, Wednesday, Thursday, Friday, Saturday }
enum WeekParity { Above = 'above', Below = 'below', Both = 'both' }
enum LessonType { Lecture, Seminar, Lab, Exam, Credit }

export enum Color {
   Blue   = 'blue',
   Green  = 'green',
   Amber  = 'amber',
   Red    = 'red',
   Purple = 'purple',
   Pink   = 'pink',
   Teal   = 'teal',
   Orange = 'orange',
   Indigo = 'indigo',
   Lime   = 'lime',
   Cyan   = 'cyan',
   Rose   = 'rose',
}

// ===== Глобальные данные (общие на все проекты, read-only из проекта) =====

interface DayPatternItem {
  index: number;      // с 1, последовательно; элементы идут по времени, без перекрытий
  start: string;      // "09:00"
  end: string;        // "10:30"
}

interface DayPattern {
  id: ID;
  name: string;       // "Стандартный", "Сокращённый"
  items: DayPatternItem[];
}

interface WeekPatternDay {
  weekday: Weekday;
  templateId: ID | null;  // null = выходной
}

interface WeekPattern {
  id: ID;
  name: string;
  days: WeekPatternDay[]; // 6 дней: Monday–Saturday
  color: Color; // Если не был назначен при создании - случайный
}

interface WeekOverride {
  weekIndex: number;
  patternId: ID;
}

interface AcademicCalendar {
  id: ID;
  name: string;               // "2026/2027"
  startDate: string;
  weeks: number;              // 40
  defaultPatternId: ID;
  overrides: WeekOverride[];
  holidays: string[]; // даты в формате "YYYY-MM-DD"; день — выходной: вхождение урока на эту дату не существует (часы не начисляются, конфликтов нет); уроки на эту дату возвращаются в нерасставленную нагрузку, сетка заблокирована
}

interface Teacher {
  id: ID;
  fullName: string;
}

interface Room {
  id: ID;
  name: string;               // "305"
  capacity: number;
  kind: 'lecture' | 'lab' | 'computer' | 'gym' | 'other';
}

interface StudentGroup {
  id: ID;
  name: string;               // "ИПИ-21-1"
  size: number;
  courseYear?: number;
  admissionYear?: number;
}

interface Discipline {
  id: ID;
  name: string;
  color: Color; // Если не был назначен при создании - случайный
}

// ===== Данные проекта (персональные для ScheduleProject) =====

interface TeachingLoad {
  // нельзя удалить, если ссылается хотя бы один Lesson;
  // одна строка = одна группа, строка с несколькими groupIds — поток
  // (создаётся слиянием строк, см. use-cases/05-flows.md)
  id: ID;
  disciplineId: ID;   // неизменяемое
  teacherId?: ID;              // опционально, но необходимо назначить ДО или во время установки в сетку расписания
  groupIds: ID[];              // как правило одна группа; несколько — поток
  lessonType: LessonType;
  hoursTotal: number;
  hoursScheduled: number;      // вычисляется
  hoursConducted: number;      // вычисляется по timestamp
}

interface Lesson {
  id: ID;
  teachingLoadId: ID;
  teacherId: ID; // денормализация, фиксируем преподавателя; при смене преподавателя в TeachingLoad меняются только те Lesson, которые ещё не прошли
  roomId: ID; // занимаем комнату
  groupIds: ID[]; // снимок состава групп на момент создания урока (аналог teacherId): при смене состава в нагрузке обновляются только непрошедшие Lesson
  weekday: Weekday;
  slotIndex: number; // номер слота в дне (DayPatternItem.index), слоты нумеруются с 1
  parity: WeekParity; // для Exam/Credit (одна неделя) не имеет значения
  weekRange?: { from: number; to: number };  // номера недель — с 1, to включительно; если не установлено - все недели календаря. Для Exam/Credit — всегда одна неделя { from: N, to: N }
  isLocked?: boolean;          // вычисляется по timestamp
}

enum ConflictType {
  TeacherDoubleBooked, // преподаватель одновременно на двух парах; error
  RoomDoubleBooked, // Аудитория занята одновременно двумя занятиями; error
  GroupDoubleBooked, // Группа (или подмножество потока) уже занято в это время другим занятием; error
  RoomCapacity, // комната слишком мала для размера группы/потока; warning
  SlotUnavailable, // в шаблоне дня этой недели нет слота с данным slotIndex (в т.ч. если день — выходной); warning, не блокирует сохранение
}

interface Conflict {
  type: ConflictType;
  lessonIds: ID[];
  message: string;
  severity: 'error' | 'warning';
}

interface ScheduleProject {
  id: ID;
  name: string;                // "ИФТИС-2-осень-2026"
  calendarId: ID;              // ссылка на календарь (глобальные данные), read-only
  loads: TeachingLoad[];
  lessons: Lesson[];
}
```

Примечание: в Prisma нельзя задать числовые значения у членов enum
(`Monday = 1`) — в схеме БД такое поле хранить как строку или int.

## Карта сущностей

```
ГЛОБАЛЬНЫЕ (общие на все проекты, read-only из проекта):

  AcademicCalendar ──defaultPatternId──▶ WeekPattern
        │
        └──overrides──▶ WeekPattern ──days[].templateId──▶ DayPattern
                                                              │
                                                              └── items[] (слоты)

  Discipline (read-only, в БД через администратора)
  Teacher
  Room
  StudentGroup

ДАННЫЕ ПРОЕКТА:

  ScheduleProject ──calendarId──▶ AcademicCalendar
        │
        ├── loads: TeachingLoad[]
        │            │── disciplineId ──▶ Discipline
        │            │── teacherId? ──▶ Teacher
        │            │── groupIds[] ──▶ StudentGroup
        │            │
        └── lessons: Lesson[] ◀── teachingLoadId ──┘
                  │── teacherId (снимок), roomId, groupIds (снимок)
                  │── weekday, slotIndex, parity, weekRange
```

## Основные инварианты

- проект **не хранит** копии глобальных данных — только ссылки;
- глобальные сущности в употреблении (есть хотя бы одна ссылка из
  нагрузок, уроков или overrides календаря) **не удаляются**,
  только редактируются;
- `TeachingLoad` удаляется только без ссылающихся `Lesson`;
- проведённые (`isLocked`) вхождения уроков неизменяемы;
- расчётные поля (`hoursScheduled`, `hoursConducted`, `isLocked`,
  `Conflict`) **не хранятся** — вычисляются на лету;
- часы (академические, 45 мин): округление вверх до целого; суммирование
  только по реально существующим вхождениям (см. `time-mechanics.md`).

## Файлы

| Файл | Содержимое |
|---|---|
| [`global-entities.md`](global-entities.md) | DayPattern, WeekPattern, AcademicCalendar, Teacher, Room, StudentGroup, Discipline |
| [`project-entities.md`](project-entities.md) | ScheduleProject, TeachingLoad, Lesson |
| [`conflicts.md`](conflicts.md) | Типы конфликтов, severity, правила детекции, endpoint |
| [`time-mechanics.md`](time-mechanics.md) | Разворачивание уроков в вхождения, парность, праздники, локи, дробление, расчёт часов |
