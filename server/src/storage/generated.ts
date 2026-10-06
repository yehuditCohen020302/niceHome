import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { isValidId, newId } from './ids';

/** Visualizations created by the image generator, kept on the user's machine. */
const generatedDir = path.join(config.dataDir, 'generated');

export async function saveGenerated(image: Buffer): Promise<string> {
  await fs.mkdir(generatedDir, { recursive: true });
  const id = newId();
  await fs.writeFile(path.join(generatedDir, `${id}.jpg`), image);
  return id;
}

export async function findGenerated(id: string): Promise<string | null> {
  if (!isValidId(id)) return null;
  const filePath = path.join(generatedDir, `${id}.jpg`);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}
