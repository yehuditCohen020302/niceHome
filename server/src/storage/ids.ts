import { randomUUID } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const newId = (): string => randomUUID();

/** Ids become file names, so only well-formed UUIDs are ever accepted. */
export const isValidId = (id: string): boolean => UUID_PATTERN.test(id);
