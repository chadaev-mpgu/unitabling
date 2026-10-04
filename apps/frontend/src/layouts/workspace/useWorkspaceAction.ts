import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

/**
 * Связь кнопки действия в шапке рабочей области со страницей: страница
 * регистрирует обработчик, шапка вызывает его по клику. Позволяет держать
 * кнопку в шапке, а логику (открытие диалога) — в самой странице.
 */
export interface WorkspaceActionRegistry {
  /** Зарегистрированный страницей обработчик; null — страница действия не имеет. */
  handler: Ref<(() => void) | null>;
  setHandler: (handler: (() => void) | null) => void;
  run: () => void;
}

const workspaceActionKey: InjectionKey<WorkspaceActionRegistry> = Symbol('workspace-action');

/** Создаётся один раз в MainLayout — общем предке шапки и RouterView. */
export function provideWorkspaceAction(): WorkspaceActionRegistry {
  const handler = ref<(() => void) | null>(null);
  const registry: WorkspaceActionRegistry = {
    handler,
    setHandler: (next) => {
      handler.value = next;
    },
    run: () => handler.value?.(),
  };
  provide(workspaceActionKey, registry);
  return registry;
}

export function useWorkspaceAction(): WorkspaceActionRegistry | null {
  return inject(workspaceActionKey, null);
}
