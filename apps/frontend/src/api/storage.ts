/**
 * Персистентность мок-бэкенда: localStorage, ключ на коллекцию.
 * Если localStorage недоступен (приватный режим, SSR, квота) — in-memory
 * фолбэк: приложение работает, но данные не переживают перезагрузку.
 */

// v3: нагрузка и уроки привязаны к проекту (projectId); старые версии ключа
// остаются в localStorage нетронутыми, но приложением не читаются.
const KEY_PREFIX = 'unitabling:v3';

const memory = new Map<string, string>();

function detectStorage(): Storage | null {
  try {
    const probe = `${KEY_PREFIX}:__probe__`;
    globalThis.localStorage?.setItem(probe, '1');
    globalThis.localStorage?.removeItem(probe);
    return globalThis.localStorage ?? null;
  } catch {
    console.warn(
      '[api/storage] localStorage недоступен — данные не сохраняются между перезагрузками',
    );
    return null;
  }
}

let storage: Storage | null = detectStorage();

function key(collection: string): string {
  return `${KEY_PREFIX}:${collection}`;
}

/** Читает коллекцию; null — коллекции ещё нет или данные повреждены. */
export function readCollection<T>(collection: string): T[] | null {
  const raw = storage ? storage.getItem(key(collection)) : memory.get(key(collection));
  if (raw == null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    console.warn(`[api/storage] коллекция «${collection}» повреждена — будет пересоздана`);
    return null;
  }
}

export function writeCollection<T>(collection: string, items: T[]): void {
  const raw = JSON.stringify(items);

  if (storage) {
    try {
      storage.setItem(key(collection), raw);
      return;
    } catch {
      console.warn('[api/storage] запись в localStorage не удалась — переключаюсь на память');
      storage = null;
    }
  }

  memory.set(key(collection), raw);
}

/** Читает одиночное значение (не коллекцию); null — значения нет или оно повреждено. */
export function readValue<T>(name: string): T | null {
  const raw = storage ? storage.getItem(key(name)) : memory.get(key(name));
  if (raw == null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[api/storage] значение «${name}» повреждено — игнорирую`);
    return null;
  }
}

/** Записывает одиночное значение (не коллекцию) в персистентное хранилище. */
export function writeValue<T>(name: string, value: T): void {
  const raw = JSON.stringify(value);

  if (storage) {
    try {
      storage.setItem(key(name), raw);
      return;
    } catch {
      console.warn('[api/storage] запись в localStorage не удалась — переключаюсь на память');
      storage = null;
    }
  }

  memory.set(key(name), raw);
}
