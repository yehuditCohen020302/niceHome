import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import type { DesignRecord } from '../pipeline/generateDesign';
import { isValidId } from './ids';

const designsDir = path.join(config.dataDir, 'designs');

export async function saveDesign(record: DesignRecord): Promise<void> {
  await fs.mkdir(designsDir, { recursive: true });
  await fs.writeFile(
    path.join(designsDir, `${record.design.id}.json`),
    JSON.stringify(record, null, 2),
    'utf8',
  );
}

export async function getDesignRecord(id: string): Promise<DesignRecord | null> {
  if (!isValidId(id)) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(designsDir, `${id}.json`), 'utf8')) as DesignRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
