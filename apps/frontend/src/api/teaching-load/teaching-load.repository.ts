import type { TeachingLoad } from '@/domain/teaching-load.ts';

import { createRepository } from '../repository.ts';

export const teachingLoadRepository = createRepository<TeachingLoad>('teaching-loads');
