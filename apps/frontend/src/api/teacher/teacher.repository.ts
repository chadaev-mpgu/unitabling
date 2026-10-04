import type { Teacher } from '@/domain/teacher.ts';

import { createRepository } from '../repository.ts';

export const teacherRepository = createRepository<Teacher>('teachers');
