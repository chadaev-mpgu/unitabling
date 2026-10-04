import type { Room } from '@/domain/room.ts';

import { uuidv4 } from '../utils.ts';

export function buildRooms(): Room[] {
  return [
    { id: uuidv4(), name: '101', kind: 'lecture', capacity: 30 },
    { id: uuidv4(), name: '102', kind: 'lecture', capacity: 15 },
    { id: uuidv4(), name: '103', kind: 'lecture', capacity: 20 },
    { id: uuidv4(), name: '104', kind: 'lecture', capacity: 30 },
    { id: uuidv4(), name: '201', kind: 'lab', capacity: 10 },
    { id: uuidv4(), name: '202', kind: 'lab', capacity: 30 },
    { id: uuidv4(), name: '203', kind: 'computer', capacity: 20 },
    { id: uuidv4(), name: '204', kind: 'computer', capacity: 20 },
  ];
}
