# Сущности проекта

## ScheduleProject

```typescript
interface ScheduleProject {
  id: ID;
  name: string;                // "ИФТИС-2-осень-2026"
  calendarId: ID;              // ссылка на календарь (глобальные данные), read-only
  loads: TeachingLoad[];
  lessons: Lesson[];
}
```

- проект = одно расписание за один период для всех групп
  факультета/института;
- курс/семестр/год закодированы в имени, отдельными полями не хранятся;
- проект не влияет на календарь и не хранит его период.

## TeachingLoad — строка учебной нагрузки

```typescript
interface TeachingLoad {
  id: ID;
  disciplineId: ID;   // неизменяемое
  teacherId?: ID;     // опционально, назначается ДО или во время установки в сетку
  groupIds: ID[];     // как правило одна группа; несколько — поток
  lessonType: LessonType;
  hoursTotal: number;
  hoursScheduled: number; // вычисляется
  hoursConducted: number; // вычисляется по timestamp
}
```

Инварианты:
- одна строка = одна группа (свои часы); строка с несколькими
  `groupIds` — **поток**, создаётся только слиянием
  (см. `../../use-cases/05-flows.md`);
- после создания изменяется только `teacherId`; дисциплина, группа
  (состав), тип и `hoursTotal` неизменяемы (кроме вычитания при
  слиянии в поток);
- допускаются несколько строк с одинаковыми (discipline, group,
  lessonType) — независимые «партии» часов;
- удаление — только если не ссылается ни один `Lesson`;
- расчётные:
  - `hoursScheduled` — сумма часов существующих вхождений
    всех Lesson строки;
  - `hoursConducted` — сумма часов прошедших вхождений (по timestamp);
  - **остаток** = `hoursTotal − hoursScheduled` — доступный ресурс
    строки для расстановки и слияний.

## Lesson — правило, а не событие

```typescript
interface Lesson {
  id: ID;
  teachingLoadId: ID;
  teacherId: ID;      // снимок; см. ниже
  roomId: ID;
  groupIds: ID[];     // снимок; см. ниже
  weekday: Weekday;
  slotIndex: number;  // номер слота в дне (DayPatternItem.index), слоты нумеруются с 1
  parity: WeekParity; // для Exam/Credit (одна неделя) не имеет значения
  weekRange?: { from: number; to: number };
  isLocked?: boolean; // вычисляется по timestamp
}
```

Поля-снимки (`teacherId`, `groupIds`):
- фиксируют состояние на момент создания урока;
- при смене преподавателя/состава в TeachingLoad обновляются **только
  непрошедшие** Lesson;
- прошедшие вхождения сохраняют исходные значения — история
  не искажается ретроспективными изменениями.

`weekRange`:
- номера недель — с 1, `to` **включительно**;
- не установлена — все недели календаря;
- для Exam/Credit всегда ровно одна неделя `{ from: N, to: N }`.

`isLocked` (и продление: вхождения урока в прошлом):
- вычисляется по timestamp; прошедшие вхождения нельзя удалять
  и изменять;
- частичное прошедшее время обрабатывается дроблением weekRange —
  см. `time-mechanics.md`.

Распространение на недели/даты — см. `time-mechanics.md`.
