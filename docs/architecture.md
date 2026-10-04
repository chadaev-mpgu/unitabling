# Архитектура и структура фронтенда

Документ описывает слои приложения, структуру папок, правила именования
и конвенции кода. Продуктовые требования и модель данных — в соседних
разделах (`use-cases/`, `data-model/`), здесь — как устроен код
`apps/frontend`.

## Слои и направление зависимостей

| Слой | Ответственность |
|---|---|
| `pages/` | Экраны: композиция компонентов, состояние экрана, локальные компоненты |
| `components/` | Компоненты, общие для нескольких страниц |
| `layouts/` | Каркас приложения: шапка, навигация, рабочая область |
| `stores/` | Pinia-сторы: состояние и **единственная** точка доступа к данным |
| `domain/` | Сущности и чистая логика; не знает про Vue, Pinia и API |
| `api/` | Мок-бэкенд: репозиторий на коллекцию + сиды |
| `lib/` | Инфраструктурные утилиты без домена (`cn`, даты, uuid) |
| `router/` | Маршруты и контракт `RouteMeta` |

Зависимости идут только «вниз»:

```
pages ──► components ──► domain ──► lib
  │            │            ▲
  └──────► stores ──► api ───┘
```

Правила:

- `domain/` не импортирует Vue, Pinia и `api/` — только другие модули
  `domain/` и `lib/`.
- Компоненты не импортируют `api/` напрямую: данные приходят через сторы.
  Исключение — `main.ts`, который наполняет мок-бэкенд до старта
  (`ensureSeedData()`).
- Доменные типы не реэкспортируются из компонентных barrel'ов: импортируйте
  их из `@/domain/...`.
- `lib/` не знает про домен.

## Структура

```
apps/frontend/src/
├─ api/                      # мок-бэкенд (localStorage)
│  ├─ <entity>/<entity>.repository.ts
│  ├─ seed/                  # идемпотентные тестовые данные
│  ├─ index.ts               # публичный вход api-слоя
│  ├─ repository.ts          # createRepository<T> — коллекция
│  └─ storage.ts             # localStorage + in-memory фолбэк
├─ assets/styles/main.css    # Tailwind и дизайн-токены
├─ components/
│  ├─ list-row/              # ListRow* — строка списка с маркером
│  ├─ ui/                    # shadcn-vue (генерируемый, вручную не правим)
│  └─ week/                  # WeekPicker, WeekNavigator, useWeekPages
├─ domain/                   # сущности и чистая логика
├─ layouts/                  # MainLayout, Header, Navbar, WorkspaceHeader
├─ lib/                      # utils.ts, date.ts, uuid.ts
├─ pages/
│  ├─ academic-calendar/     # AcademicCalendarPage
│  ├─ dashboard/             # DashboardPage
│  ├─ day-patterns/          # DayPatternPage
│  ├─ rooms/                 # RoomListPage
│  ├─ schedule/              # SchedulePage + components/{lesson-dialog,schedule-grid,schedule-toolbar}
│  ├─ student-groups/        # StudentGroupListPage
│  ├─ teachers/              # TeacherListPage
│  ├─ teaching-load/         # TeachingLoadPage
│  └─ week-patterns/         # WeekPatternPage
├─ router/index.ts
├─ stores/
│  ├─ global/                # глобальные сущности (общие для проектов)
│  └─ project/               # сущности проекта
├─ App.vue
└─ main.ts
```

Каждая страница — папка с `index.ts` (barrel) и файлом `<Name>Page.vue`;
локальные компоненты — в `pages/<page>/components/<feature>/`.

## Именование

### Файлы

| Что | Правило | Пример |
|---|---|---|
| Компонент | `PascalCase.vue` | `ScheduleGrid.vue`, `WeekPicker.vue` |
| Модуль, сущность | `kebab-case.ts` | `academic-calendar.ts`, `student-group.ts` |
| Composable | `useXxx.ts` рядом с потребителем | `useWeekPages.ts`, `useLessonDialog.ts` |
| Barrel | `index.ts` | `components/week/index.ts` |
| Сопутствующие | `types.ts`, `constants.ts`, `schema.ts` | `lesson-dialog/types.ts` |

### Компоненты

- Имя = `<Домен><Роль>`: `ScheduleGrid`, `LessonCard`, `WeekPicker`.
  Понятность важнее краткости.
- Части составного компонента носят префикс родителя:
  `ListRow`, `ListRowTitle`, `ListRowDescription`, `ListRowDragHandle`.
- Общие компоненты выносим в `components/` при **втором** потребителе;
  до этого компонент живёт в `pages/<page>/components/`.
- `components/ui/` — только shadcn-vue: не переименовываем и не правим
  стиль файлов, чтобы обновление через CLI не конфликтовало.

### Страницы

- Директория = сегмент URL: `teachers/` → `/teachers`, `day-patterns/` →
  `/day-patterns`.
- Файл = `<Name>Page.vue`, имя отражает экран: `TeacherListPage`,
  `AcademicCalendarPage`.
- Заголовок экрана и кнопка действия — через `route.meta`
  (`title`, `action`), а не хардкод в компонентах.

### Сторы

- Файл зеркалит сущность `domain/`: `stores/global/teacher.ts` →
  `useTeacherStore`.
- `global/` — глобальные сущности, общие для всех проектов (справочники,
  академический календарь); `project/` — данные проекта (уроки, нагрузка).
- Состояние называется во множественном числе: `teachers`, `loads`,
  `lessons`.

### Импорты и barrel'ы

- Между папками — только alias `@/...`, внутри папки — относительные
  импорты.
- Папка = модуль: у папки с компонентами есть `index.ts`, снаружи импорт
  идёт через него (`@/components/week`, `@/pages/schedule/components/lesson-dialog`).
- Расширение `.ts` указываем явно: `./types.ts`, `@/lib/date.ts`.
- `_wip/` — незаконченный код: не экспортируется из `index.ts` и не
  импортируется продовым кодом.

## Конвенции кода

### Vue

- Только `<script setup lang="ts">`; порядок блоков: script, затем template.
- Props — через `interface Props` и `defineProps<Props>()`, значения по
  умолчанию — `withDefaults`.
- Проброс класса — проп `class?: HTMLAttributes['class']` + `cn(...)`.
- Стилей в SFC нет: только Tailwind-классы. Общие токены — в
  `assets/styles/main.css`.
- Для отладки и тестов используем `data-slot="<component>-<part>"`
  в kebab-case (`schedule-grid-cell`, `lesson-card-title`).
- Композаблы не выносятся в глобальную папку: живут рядом с компонентом,
  который их использует (исключение — общая логика в `domain/`).

### Домен

- Сущности и функции — чистые, без сайд-эффектов и обращений к хранилищу.
- View-модели для UI (`schedule-view.ts`) денормализуют данные, подставляя
  подписи из справочников.
- «Pre-request» логика (`lesson-draft.ts`) считает вхождения и конфликты
  до сохранения — форма показывает их в предпросмотре.

### Сторы и данные

- Сторы — setup-стиль: `defineStore('id', () => { ... })`.
- Компоненты только читают состояние стора; любые изменения — через
  actions стора (иначе запись не попадёт в хранилище).
- Работа с репозиториями — внутри сторов; `api/` не «протекает» в
  компоненты.
- Мутирующие методы смотрят в будущее: например, `saveLesson` уже
  асинхронный — при переходе на HTTP асинхронными станут только
  репозитории.

### API (мок-бэкенд)

- Одна коллекция = один `createRepository<T>(collection)`; ключ в
  localStorage — `unitabling:v1:<collection>`.
- Коллекции наполняются идемпотентно (`ensureSeedData`): заполненные
  не трогаются.
- Ссылки на справочники хранятся как id; подписи резолвятся в домене
  (`lookups.ts`).

### Стиль и проверки

- Prettier: одинарные кавычки, точки с запятой, ширина 100.
- Линтеры: oxlint + eslint (`vue/essential`, TypeScript recommended).
  Для `src/components/ui/**` и `src/layouts/**` отключено правило
  многословных имён — там живут апстрим-имена (`Card`, `Header`).
- Перед коммитом: `pnpm --filter frontend type-check`, `lint`, `format`.

## Куда положить код

1. Нужен компонент на нескольких страницах → `components/<feature>/`.
2. Компонент одной страницы → `pages/<page>/components/<feature>/`.
3. Чистая логика или тип сущности → `domain/<entity>.ts`.
4. Чтение/запись данных → стор в `stores/global|project/`.
5. Утилита без домена → `lib/`.
6. Примитив shadcn-vue → `components/ui/` (генерируется CLI).
