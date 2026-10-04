import { uuidv4 } from '@/lib/uuid.ts';

import { readCollection, writeCollection } from './storage.ts';

export interface Repository<T extends { id: string }> {
  list(): T[];
  create(request: Omit<T, 'id'>): T;
  update(entity: T): T;
  remove(id: string): void;
  replaceAll(items: T[]): void;
  isEmpty(): boolean;
}

/**
 * Коллекция мок-бэкенда: id присваивает «сервер», запись идёт сразу
 * в персистентное хранилище. Методы синхронные — localStorage синхронен;
 * при переходе на HTTP асинхронными станут только репозитории.
 */
export function createRepository<T extends { id: string }>(collection: string): Repository<T> {
  function list(): T[] {
    return readCollection<T>(collection) ?? [];
  }

  function create(request: Omit<T, 'id'>): T {
    const entity = { id: uuidv4(), ...request } as T;
    const items = list();
    items.push(entity);
    writeCollection(collection, items);
    return entity;
  }

  function update(entity: T): T {
    const items = list();
    const index = items.findIndex(({ id }) => id === entity.id);
    if (index === -1) {
      throw new Error(`[api] запись «${entity.id}» не найдена в коллекции «${collection}»`);
    }
    items[index] = entity;
    writeCollection(collection, items);
    return entity;
  }

  function remove(id: string): void {
    const items = list();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`[api] запись «${id}» не найдена в коллекции «${collection}»`);
    }
    items.splice(index, 1);
    writeCollection(collection, items);
  }

  function replaceAll(items: T[]): void {
    writeCollection(collection, items);
  }

  function isEmpty(): boolean {
    return list().length === 0;
  }

  return { list, create, update, remove, replaceAll, isEmpty };
}
