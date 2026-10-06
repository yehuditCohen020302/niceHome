import type { CreateRoomRequest, Room } from '@nice-home/shared';
import { apiRequest } from './client';

export function createRoom(request: CreateRoomRequest, signal?: AbortSignal): Promise<Room> {
  return apiRequest<Room>('/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
}

export function getRoom(id: string, signal?: AbortSignal): Promise<Room> {
  return apiRequest<Room>(`/rooms/${encodeURIComponent(id)}`, { signal });
}
