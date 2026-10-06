import fs from 'node:fs/promises';
import path from 'node:path';
import type { Room } from '@nice-home/shared';
import { config } from '../config';
import { isValidId } from './ids';

const roomsDir = path.join(config.dataDir, 'rooms');

export async function saveRoom(room: Room): Promise<void> {
  await fs.mkdir(roomsDir, { recursive: true });
  await fs.writeFile(path.join(roomsDir, `${room.id}.json`), JSON.stringify(room, null, 2), 'utf8');
}

export async function getRoom(id: string): Promise<Room | null> {
  if (!isValidId(id)) return null;
  try {
    const raw = await fs.readFile(path.join(roomsDir, `${id}.json`), 'utf8');
    return JSON.parse(raw) as Room;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
