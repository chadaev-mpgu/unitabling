import type { WeekPattern } from '@/domain/week-pattern.ts';

import { createRepository } from '../repository.ts';

export const weekPatternRepository = createRepository<WeekPattern>('week-patterns');
