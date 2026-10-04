import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';

import { calendarWeeks } from '@/domain/academic-calendar.ts';
import {
  LessonType,
  type CreateLessonRequest,
  type Lesson,
  type UpdateLessonRequest,
} from '@/domain/lesson.ts';
import { findDiscipline, findStudentGroup } from '@/domain/lookups.ts';
import {
  firstFutureWeek,
  hasPastOccurrences,
  isFullyPast,
  pastPeriodParities,
} from '@/domain/occurrence.ts';
import { buildScheduleCellLayout } from '@/domain/schedule-view.ts';
import {
  periodParities as paritiesOfPeriod,
  periodWeek,
  WeekParity,
  type WeekParitySide,
  type WeekRange,
} from '@/domain/week.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useRoomStore } from '@/stores/global/room.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

import type { LessonDialogContext, LessonFormValues } from './types.ts';

/** Что сессия диалога берёт из страницы: занятость клетки и границы периода. */
export interface LessonDialogOptions {
  /**
   * Уроки выбранного вида, пересекающие период — тот же набор, по которому
   * сетка считает занятость половин. Конфликты при этом считаются по всем
   * урокам проекта.
   */
  layoutLessons: MaybeRefOrGetter<Lesson[]>;
  /** Период — пара недель: прошедшие половины блокируются (UC-4.1). */
  period: MaybeRefOrGetter<WeekRange>;
  /** Текущее время — граница прошедшего; обновляется на странице. */
  now: MaybeRefOrGetter<Date>;
}

/**
 * Сессия диалога занятия: создание из дропа нагрузки и правка урока из сетки.
 * Черновик формы живёт в самом диалоге (vee-validate), сюда приходит уже
 * провалидированный набор значений.
 */
function createLessonDialogSession(options: LessonDialogOptions) {
  const lessonStore = useLessonStore();
  const teachingLoadStore = useTeachingLoadStore();
  const projectStore = useScheduleProjectStore();
  const disciplineStore = useDisciplineStore();
  const teacherStore = useTeacherStore();
  const roomStore = useRoomStore();
  const studentGroupStore = useStudentGroupStore();
  const calendarStore = useAcademicCalendarStore();

  /* Состояние сессии */

  const isOpen = ref(false);
  const context = ref<LessonDialogContext | null>(null);

  /** Ошибка сохранения/удаления, пришедшая с «сервера». */
  const submitError = ref<string | null>(null);

  /** Контекст создания: клетка и нагрузка дропа. */
  const createContext = computed(() => (context.value?.kind === 'create' ? context.value : null));

  /** Режим правки: диалог открыт по клику на урок, а не по дропу нагрузки. */
  const isEdit = computed(() => context.value?.kind === 'edit');

  const day = computed(() => context.value?.day ?? null);
  const slot = computed(() => context.value?.slot ?? null);

  /** Правимый урок резолвится из стора по id: объект из сетки был бы снимком. */
  const editedLesson = computed(() => {
    const current = context.value;
    if (current?.kind !== 'edit') return null;
    return lessonStore.lessons.find(({ id }) => id === current.lessonId) ?? null;
  });

  /** Нагрузка: при создании — из контекста дропа, при правке — из урока. */
  const load = computed(() => {
    const current = context.value;
    const loadId =
      current?.kind === 'create' ? current.loadId : (editedLesson.value?.teachingLoadId ?? null);
    if (!loadId) return null;
    return teachingLoadStore.loads.find(({ id }) => id === loadId) ?? null;
  });

  const discipline = computed(() =>
    load.value
      ? (findDiscipline(disciplineStore.disciplines, load.value.disciplineId) ?? null)
      : null,
  );

  /** Exam/Credit — не повторяющийся паттерн: диапазон всегда ровно одна неделя. */
  const isSingleWeek = computed(
    () =>
      load.value?.lessonType === LessonType.Exam || load.value?.lessonType === LessonType.Credit,
  );

  /* Опции формы */

  const rooms = computed(() =>
    [...roomStore.rooms].sort((left, right) =>
      left.name.localeCompare(right.name, 'ru', { numeric: true }),
    ),
  );

  const teachers = computed(() =>
    [...teacherStore.teachers].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, 'ru'),
    ),
  );

  /** Группы нагрузки — снимок: поток расставляется целиком (UC-5.3). */
  const groups = computed(() =>
    (load.value?.groupIds ?? []).map(
      (id) => findStudentGroup(studentGroupStore.studentGroups, id) ?? { id, name: id, size: 0 },
    ),
  );

  /** Недели календаря — для выбора диапазона недель. */
  const weeks = computed(() => calendarWeeks(calendarStore.currentCalendar));

  const calendar = computed(() => calendarStore.currentCalendar);

  /** Текущее время и период — границы прошедшего для целевой клетки. */
  const now = computed(() => toValue(options.now));
  const period = computed(() => toValue(options.period));

  /** Данные проекта — для анализа черновика (конфликты, предпросмотр). */
  const lessons = computed(() => lessonStore.lessons);
  const studentGroups = computed(() => studentGroupStore.studentGroups);

  /**
   * Уроки для анализа: правимый урок исключается — он не конфликтует сам
   * с собой и не занимает собственную половину клетки.
   */
  const analysisLessons = computed(() => {
    const editedId = editedLesson.value?.id;
    return editedId ? lessons.value.filter(({ id }) => id !== editedId) : lessons.value;
  });

  /**
   * Уроки целевой клетки для раскладки половин — тот же набор, по которому
   * сетка считает занятость (`layoutLessons`): уроки вида, чьи диапазоны
   * пересекают период. Иначе свободная в сетке половина оказалась бы занятой
   * в диалоге (или наоборот) и дроп не сохранился бы.
   */
  const cellLessons = computed(() =>
    toValue(options.layoutLessons).filter(
      (lesson) =>
        lesson.id !== editedLesson.value?.id &&
        lesson.weekday === day.value?.key &&
        lesson.slotIndex === slot.value?.number &&
        // Прошедший урок не занимает клетку для будущей правки: зафиксированный
        // фрагмент пары дробления не должен блокировать правку остатка.
        !isFullyPast(calendar.value, lesson, now.value),
    ),
  );

  /** Раскладка клетки по парностям: какие половины ещё свободны. */
  const cellLayout = computed(() => buildScheduleCellLayout(cellLessons.value));

  /** Парности половин, существующие в периоде. */
  const periodParities = computed(() => paritiesOfPeriod(period.value));

  /** Прошедшие половины целевой клетки: постановка и правка в них запрещены. */
  const pastParities = computed<WeekParitySide[]>(() => {
    const currentDay = day.value;
    const currentSlot = slot.value;
    if (!currentDay || !currentSlot) return [];
    return pastPeriodParities(
      calendar.value,
      period.value,
      currentDay.key,
      currentSlot.number,
      now.value,
    );
  });

  /** Клетка пуста: Exam/Credit ставится только в пустую клетку (UC-4.1). */
  const isCellEmpty = computed(() => cellLayout.value.allowed.includes(WeekParity.Both));

  /**
   * Доступные парности: свободные половины периода. При создании прошедшая
   * половина недоступна, но `Both` можно, пока есть будущая неделя: диапазон
   * начнётся с неё, и прошедшее в правило не попадёт (UC-4.1). При правке
   * прошедшие вхождения фиксирует сервер дроблением, поэтому они не
   * ограничивают будущую часть.
   */
  const allowedParities = computed<WeekParity[]>(() =>
    cellLayout.value.allowed.filter((parity) => {
      if (!isEdit.value) {
        if (parity === WeekParity.Both) {
          return periodParities.value.some((side) => !pastParities.value.includes(side));
        }
        if (pastParities.value.includes(parity)) return false;
      }
      return parity === WeekParity.Both || periodParities.value.includes(parity);
    }),
  );

  /**
   * Парность по умолчанию: половина дропа, если она свободна; иначе Both
   * (пустая клетка); иначе единственная свободная половина.
   */
  const targetParity = computed<WeekParity>(() => {
    const dropped = createContext.value?.parity;
    if (dropped && allowedParities.value.includes(dropped)) return dropped;
    if (allowedParities.value.includes(WeekParity.Both)) return WeekParity.Both;
    return allowedParities.value[0] ?? WeekParity.Both;
  });

  /** Первая будущая неделя для парности: прошедшие недели не назначаем. */
  function firstFutureWeekFor(parity: WeekParity): number {
    const currentDay = day.value;
    const currentSlot = slot.value;
    if (!currentDay || !currentSlot) return 1;
    return (
      firstFutureWeek(
        calendar.value,
        { weekday: currentDay.key, slotIndex: currentSlot.number, parity },
        now.value,
      ) ?? calendar.value.weeks
    );
  }

  /** Значения формы: при правке — из урока, при создании — из контекста дропа. */
  const defaultValues = computed<LessonFormValues>(() => {
    const lesson = editedLesson.value;
    if (lesson) {
      // Начало — не раньше первой будущей недели для этой пары: прошедшее
      // сервер отрезает, форма сразу показывает итоговый диапазон.
      const weekFrom = Math.max(lesson.weekRange?.from ?? 1, firstFutureWeekFor(lesson.parity));
      return {
        roomId: lesson.roomId,
        teacherId: lesson.teacherId,
        parity: lesson.parity,
        weekFrom,
        // Exam/Credit живёт ровно одну неделю: «по» не должно разъезжаться с «с».
        weekTo:
          lesson.weekRange?.to ??
          (isSingleWeek.value ? weekFrom : calendarStore.currentCalendar.weeks),
      };
    }

    const parity = isSingleWeek.value ? WeekParity.Both : targetParity.value;
    const firstFuture = firstFutureWeekFor(parity);
    // Exam/Credit ставится на неделю половины, в которую бросили нагрузку.
    const dropped = isSingleWeek.value ? createContext.value?.parity : undefined;
    const weekFrom = dropped
      ? Math.max(periodWeek(period.value, dropped), firstFuture)
      : firstFuture;

    return {
      // В виде по аудитории страница подставляет выбранную аудиторию.
      roomId: createContext.value?.roomId ?? '',
      teacherId: load.value?.teacherId ?? '',
      parity,
      weekFrom,
      weekTo: isSingleWeek.value ? weekFrom : calendar.value.weeks,
    };
  });

  /** Удалять можно только урок без прошедших вхождений (UC-4.3). */
  const canDelete = computed(() => {
    const lesson = editedLesson.value;
    return lesson !== null && !hasPastOccurrences(calendar.value, lesson, now.value);
  });

  /* Действия */

  function open(payload: LessonDialogContext): void {
    submitError.value = null;
    if (payload.kind === 'create') {
      // Пока карточку тащили, данные могли сбросить — тогда открывать нечего.
      if (!teachingLoadStore.loads.some(({ id }) => id === payload.loadId)) return;
    } else {
      const lesson = lessonStore.lessons.find(({ id }) => id === payload.lessonId);
      if (!lesson || !teachingLoadStore.loads.some(({ id }) => id === lesson.teachingLoadId))
        return;
      // Прошедший урок — история: панель не открывается (UC-4.3).
      if (isFullyPast(calendar.value, lesson, now.value)) return;
    }

    context.value = payload;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Собирает запрос, сохраняет урок и обновляет состояние расписания. */
  async function submit(values: LessonFormValues): Promise<void> {
    const current = context.value;
    const currentLoad = load.value;
    if (!current || !currentLoad) return;

    // Для Exam/Credit парность не имеет значения (docs/data-model/project-entities.md).
    const parity = isSingleWeek.value ? WeekParity.Both : values.parity;
    // Клетка занята целиком (например, Exam/Credit поверх пары) — не сохраняем.
    if (isSingleWeek.value ? !isCellEmpty.value : !allowedParities.value.includes(parity)) return;

    // Прошедшие недели не назначаем: сервер отрежет их и при сохранении.
    const weekFrom = Math.max(values.weekFrom, firstFutureWeekFor(parity));
    const isFullRange = weekFrom <= 1 && values.weekTo >= calendar.value.weeks;
    // Отсутствие диапазона = все недели календаря (пока прошедших недель нет).
    const weekRange =
      isSingleWeek.value || !isFullRange ? { from: weekFrom, to: values.weekTo } : undefined;

    submitError.value = null;
    try {
      if (current.kind === 'edit') {
        const request: UpdateLessonRequest = {
          id: current.lessonId,
          teacherId: values.teacherId,
          roomId: values.roomId,
          parity,
          weekRange,
        };
        await lessonStore.editLesson(request);
      } else {
        // Занятие принадлежит текущему проекту; без проекта сохранять некуда.
        const projectId = projectStore.currentProjectId;
        if (!projectId) return;
        const request: CreateLessonRequest = {
          projectId,
          teachingLoadId: currentLoad.id,
          teacherId: values.teacherId,
          roomId: values.roomId,
          groupIds: [...currentLoad.groupIds],
          weekday: current.day.key,
          slotIndex: current.slot.number,
          parity,
          weekRange,
        };
        await lessonStore.addLesson(request);

        // Преподаватель назначается нагрузке при первой расстановке.
        if (!currentLoad.teacherId) {
          teachingLoadStore.assignTeacher(currentLoad.id, values.teacherId);
        }
      }

      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось сохранить занятие';
    }
  }

  /** Удаляет правимый урок. */
  async function remove(): Promise<void> {
    const lesson = editedLesson.value;
    if (!lesson) return;
    submitError.value = null;
    try {
      await lessonStore.removeLesson(lesson.id);
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось удалить занятие';
    }
  }

  return {
    isOpen,
    isEdit,
    day,
    slot,
    load,
    discipline,
    isSingleWeek,
    rooms,
    teachers,
    groups,
    weeks,
    calendar,
    now,
    analysisLessons,
    studentGroups,
    allowedParities,
    isCellEmpty,
    canDelete,
    submitError,
    defaultValues,
    firstFutureWeekFor,
    open,
    close,
    submit,
    remove,
  };
}

export type LessonDialogSession = ReturnType<typeof createLessonDialogSession>;

const lessonDialogKey: InjectionKey<LessonDialogSession> = Symbol('lesson-dialog');

/**
 * Создаёт сессию диалога и отдаёт её потомкам через provide.
 * Вызывается один раз в SchedulePage: состояние живёт ровно столько,
 * сколько живёт страница.
 */
export function provideLessonDialog(options: LessonDialogOptions): LessonDialogSession {
  const session = createLessonDialogSession(options);
  provide(lessonDialogKey, session);
  return session;
}

export function useLessonDialog(): LessonDialogSession {
  const session = inject(lessonDialogKey);
  if (!session) {
    throw new Error('[schedule] useLessonDialog() вызван вне provideLessonDialog()');
  }
  return session;
}
