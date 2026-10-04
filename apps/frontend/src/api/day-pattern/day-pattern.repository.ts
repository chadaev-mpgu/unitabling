import type { DayPattern } from '@/domain/day-pattern.ts';

import { createRepository } from '../repository.ts';

export const dayPatternRepository = createRepository<DayPattern>('day-patterns');
