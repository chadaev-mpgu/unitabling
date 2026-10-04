import type { StudentGroup } from '@/domain/student-group.ts';

import { createRepository } from '../repository.ts';

export const studentGroupRepository = createRepository<StudentGroup>('student-groups');
