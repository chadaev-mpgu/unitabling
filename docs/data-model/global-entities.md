# Глобальные сущности

Общие на все проекты; проекты ссылаются на них read-only.
Управляются на экранах MVP (кроме Discipline).

## DayPattern — шаблон дня

```typescript
interface DayPattern {
  id: ID;
  name: string;       // "Стандартный", "Сокращённый"
  items: DayPatternItem[];
}

interface DayPatternItem {
  index: number;      // с 1, последовательно; элементы идут по времени, без перекрытий
  start: string;      // "09:00"
  end: string;        // "10:30"
}
```

- длительность слота = `end − start` (стандартная длительность
  не фиксируется — 45/90/120 мин и произвольные значения допустимы);
- используемый шаблон (из WeekPattern или overrides календаря)
  удалить нельзя;
- редактирование влияет на все проекты, включая вычисляемые часы
  прошедших уроков — при редактировании показывается предупреждение.

## WeekPattern — шаблон недели

```typescript
interface WeekPattern {
  id: ID;
  name: string;
  days: WeekPatternDay[]; // 6 дней: Monday–Saturday
  color: Color;           // случайный, если не назначен при создании
}

interface WeekPatternDay {
  weekday: Weekday;
  templateId: ID | null;  // null = выходной
}
```

- ровно 6 дней (Sunday не существует в модели);
- используемый шаблон удалить нельзя.

## AcademicCalendar — календарь

```typescript
interface AcademicCalendar {
  id: ID;
  name: string;               // "2026/2027"
  startDate: string;
  weeks: number;              // 40
  defaultPatternId: ID;
  overrides: WeekOverride[];  // per-week замена шаблона
  holidays: string[];         // "YYYY-MM-DD"; см. UC-1.4
}

interface WeekOverride {
  weekIndex: number;          // номер недели, с 1
  patternId: ID;
}
```

- календарь описывает год или семестр — на усмотрение методиста;
- проект НЕ влияет на календарь и не хранит период: только ссылка
  `calendarId`;
- в употреблении (есть проекты) календарь удалить нельзя;
- holidays: день — выходной; вхождение урока на эту дату не существует
  (часы не начисляются, конфликтов нет). Добавление holiday на дату
  с вхождениями отменяет их и возвращает часы в нерасставленную
  нагрузку (решение 12, в том числе для прошедших дат).

## Teacher

```typescript
interface Teacher {
  id: ID;
  fullName: string;
}
```

В употреблении (ссылки из нагрузок/уроков) удалить нельзя.

## Room

```typescript
interface Room {
  id: ID;
  name: string;               // "305"
  capacity: number;
  kind: 'lecture' | 'lab' | 'computer' | 'gym' | 'other';
}
```

`capacity` — основа конфликта `RoomCapacity`
(сумма `size` групп урока > capacity → warning).

## StudentGroup

```typescript
interface StudentGroup {
  id: ID;
  name: string;               // "ИПИ-21-1"
  size: number;
  courseYear?: number;
  admissionYear?: number;
}
```

`size` — численность для расчёта вместимости аудиторий.
В употреблении (ссылки из нагрузок/уроков) удалить нельзя.

## Discipline

```typescript
interface Discipline {
  id: ID;
  name: string;
  color: Color; // случайный, если не назначен при создании
}
```

Глобальный read-only справочник. В MVP экрана управления нет:
дисциплины загружаются администратором напрямую в БД.

## Weekday и WeekParity

```typescript
enum Weekday { Monday = 1, Tuesday, Wednesday, Thursday, Friday, Saturday }
enum WeekParity { Above = 'above', Below = 'below', Both = 'both' }
```

- `Above` — нечётные недели (1, 3, 5…), `Below` — чётные (2, 4, 6…),
  `Both` — все недели (детали — в `time-mechanics.md`);
- примечание: в Prisma числовые значения у enum задавать нельзя
  (`Monday = 1`) — в схеме БД хранить как строку или int.
