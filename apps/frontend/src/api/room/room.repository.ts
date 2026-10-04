import type { Room } from '@/domain/room.ts';

import { createRepository } from '../repository.ts';

export const roomRepository = createRepository<Room>('rooms');
