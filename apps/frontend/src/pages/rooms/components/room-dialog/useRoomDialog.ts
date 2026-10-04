import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import type { Room, RoomKind } from '@/domain/room.ts';
import { useRoomStore, type RoomReferences } from '@/stores/global/room.ts';

/** Что открыто: создание, правка или подтверждение удаления. */
export type RoomDialogContext =
  { kind: 'create' } | { kind: 'edit'; roomId: string } | { kind: 'delete'; roomId: string };

/** Значения формы аудитории. */
export interface RoomFormValues {
  name: string;
  kind: RoomKind;
  capacity: number;
}

/**
 * Сессия диалога аудитории: три режима — создание, правка и удаление.
 * Удаление разрешено, только если на аудиторию не ссылается ни одно занятие.
 */
function createRoomDialogSession() {
  const roomStore = useRoomStore();

  const isOpen = ref(false);
  const context = ref<RoomDialogContext | null>(null);

  /** Ошибка сохранения/удаления, пришедшая с «сервера». */
  const submitError = ref<string | null>(null);

  const isEdit = computed(() => context.value?.kind === 'edit');
  const isDelete = computed(() => context.value?.kind === 'delete');

  /** Правимая/удаляемая аудитория резолвится из стора по id. */
  const room = computed<Room | null>(() => {
    const current = context.value;
    if (!current || current.kind === 'create') return null;
    return roomStore.rooms.find(({ id }) => id === current.roomId) ?? null;
  });

  /** Ссылки, мешающие удалению; считается только в режиме удаления. */
  const references = computed<RoomReferences | null>(() =>
    isDelete.value && room.value ? roomStore.roomReferences(room.value.id) : null,
  );

  const canDelete = computed(() => references.value === null || references.value.total === 0);

  const title = computed(() => {
    if (isDelete.value) return 'Удалить аудиторию?';
    return isEdit.value ? 'Аудитория' : 'Новая аудитория';
  });

  const description = computed(() => {
    if (isDelete.value) return room.value?.name ?? '';
    return isEdit.value ? 'Измените данные аудитории' : 'Заполните данные аудитории';
  });

  const submitLabel = computed(() => (isEdit.value ? 'Сохранить' : 'Добавить'));

  const defaultValues = computed<RoomFormValues>(() => ({
    name: room.value?.name ?? '',
    kind: room.value?.kind ?? 'lecture',
    capacity: room.value?.capacity ?? 30,
  }));

  function open(payload: RoomDialogContext): void {
    submitError.value = null;
    if (payload.kind !== 'create' && !roomStore.rooms.some(({ id }) => id === payload.roomId)) {
      return;
    }
    context.value = payload;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Сохраняет создание/правку. */
  async function submit(values: RoomFormValues): Promise<void> {
    const current = context.value;
    if (!current || current.kind === 'delete') return;

    submitError.value = null;
    const request = {
      name: values.name.trim(),
      kind: values.kind,
      capacity: values.capacity,
    };

    try {
      if (current.kind === 'edit' && room.value) {
        await roomStore.editRoom({ ...room.value, ...request });
      } else {
        await roomStore.addRoom(request);
      }
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось сохранить аудиторию';
    }
  }

  /** Удаляет аудиторию; стор откажет, если на неё ссылается занятие. */
  async function remove(): Promise<void> {
    const target = room.value;
    if (!target) return;

    submitError.value = null;
    try {
      await roomStore.removeRoom(target.id);
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось удалить аудиторию';
    }
  }

  return {
    isOpen,
    isEdit,
    isDelete,
    title,
    description,
    submitLabel,
    room,
    references,
    canDelete,
    defaultValues,
    submitError,
    open,
    close,
    submit,
    remove,
  };
}

export type RoomDialogSession = ReturnType<typeof createRoomDialogSession>;

const roomDialogKey: InjectionKey<RoomDialogSession> = Symbol('room-dialog');

/**
 * Создаёт сессию диалога и отдаёт её потомкам через provide.
 * Вызывается один раз на странице аудиторий.
 */
export function provideRoomDialog(): RoomDialogSession {
  const session = createRoomDialogSession();
  provide(roomDialogKey, session);
  return session;
}

export function useRoomDialog(): RoomDialogSession {
  const session = inject(roomDialogKey);
  if (!session) {
    throw new Error('[rooms] useRoomDialog() вызван вне provideRoomDialog()');
  }
  return session;
}
