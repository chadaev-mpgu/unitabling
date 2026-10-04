import type { StudentGroup } from '@/domain/student-group.ts';

import { uuidv4 } from '../utils.ts';

export function buildStudentGroups(): StudentGroup[] {
  return [
    { id: uuidv4(), name: 'ВОФ34-ФиИ2501', size: 30 },
    { id: uuidv4(), name: 'ВОФ34-ИИТ2501', size: 30 },
    { id: uuidv4(), name: 'ВОФ34-ФИХ2501', size: 30 },
    { id: uuidv4(), name: 'БZФ15-ИТХ2401', size: 30 },
  ];
}
