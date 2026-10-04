import type { Discipline } from '@/domain/discipline.ts';

import { createRepository } from '../repository.ts';

export const disciplineRepository = createRepository<Discipline>('disciplines');
