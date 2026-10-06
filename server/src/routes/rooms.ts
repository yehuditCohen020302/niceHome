import { Router } from 'express';
import { z } from 'zod';
import {
  DEFAULT_COUNTRY,
  MAX_BUDGET,
  MAX_CITY_LENGTH,
  MAX_NOTES_LENGTH,
  ROOM_CONSTRAINTS,
  ROOM_TYPES,
  STYLES,
  SUPPORTED_ROOM_TYPES,
  UPGRADE_GOALS,
  type CreateRoomRequest,
  type Room,
} from '@nice-home/shared';
import { HttpError } from '../errors';
import { isValidId, newId } from '../storage/ids';
import { getRoom, saveRoom } from '../storage/rooms';
import { findUpload } from '../storage/uploads';

export const roomsRouter = Router();

const uniqueList = <T extends z.ZodType>(item: T) =>
  z.array(item).refine((list) => new Set(list).size === list.length, 'Duplicate values');

const createRoomSchema = z.object({
  imageId: z.string().refine(isValidId, 'Invalid image id'),
  roomType: z
    .enum(ROOM_TYPES)
    .refine((type) => SUPPORTED_ROOM_TYPES.includes(type), 'Room type is not supported yet'),
  goals: uniqueList(z.enum(UPGRADE_GOALS)).min(1, 'Choose at least one goal'),
  constraints: uniqueList(z.enum(ROOM_CONSTRAINTS)),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).optional(),
  location: z
    .object({
      // Only Israel is supported for now.
      country: z.literal(DEFAULT_COUNTRY),
      city: z.string().trim().max(MAX_CITY_LENGTH),
    })
    .optional(),
  budget: z.number().int().positive().max(MAX_BUDGET).nullable(),
  style: z.enum([...STYLES, 'auto']),
}) satisfies z.ZodType<CreateRoomRequest>;

roomsRouter.post('/', async (req, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'body';
    throw new HttpError(400, 'invalid_room', `${field}: ${issue?.message ?? 'Invalid value'}`);
  }

  const { imageId, notes, location, ...preferences } = parsed.data;
  if (!(await findUpload(imageId))) {
    throw new HttpError(400, 'image_not_found', 'The uploaded image no longer exists');
  }

  const room: Room = {
    id: newId(),
    imageId,
    imageUrl: `/api/uploads/${imageId}`,
    ...preferences,
    // Drop empty optional text so the stored record only holds what the user actually entered.
    ...(notes ? { notes } : {}),
    ...(location?.city ? { location } : {}),
    createdAt: new Date().toISOString(),
  };

  await saveRoom(room);
  res.status(201).json(room);
});

roomsRouter.get('/:id', async (req, res) => {
  const room = await getRoom(req.params.id);
  if (!room) {
    throw new HttpError(404, 'room_not_found', 'Room not found');
  }
  res.json(room);
});
