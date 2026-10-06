import { DESIGN_STAGES, type DesignJob, type Room } from '@nice-home/shared';
import { generateDesign } from '../pipeline/generateDesign';
import { NoProvidersAvailableError } from '../services/product-engine/ProductEngine';
import { services } from '../services/registry';
import { saveDesign } from '../storage/designs';
import { newId } from '../storage/ids';

/** Finished jobs are kept briefly so a client that polls a little late still sees the result. */
const FINISHED_JOB_TTL_MS = 10 * 60 * 1000;

// In memory on purpose: jobs only matter while a design is being built, and the app runs
// on one machine. A server restart loses running jobs; saved designs are on disk.
const jobs = new Map<string, DesignJob>();

export function getJob(id: string): DesignJob | undefined {
  return jobs.get(id);
}

/** Starts building a design in the background and returns immediately. */
export function startDesignJob(room: Room): DesignJob {
  const job: DesignJob = {
    id: newId(),
    roomId: room.id,
    status: 'running',
    stages: DESIGN_STAGES.map((id) => ({ id, status: 'pending' })),
  };
  jobs.set(job.id, job);

  void run(job, room).finally(() => {
    setTimeout(() => jobs.delete(job.id), FINISHED_JOB_TTL_MS).unref();
  });

  return job;
}

async function run(job: DesignJob, room: Room): Promise<void> {
  try {
    const record = await generateDesign(room, services, (progress) => {
      job.stages = job.stages.map((stage) => (stage.id === progress.id ? progress : stage));
    });
    await saveDesign(record);
    job.designId = record.design.id;
    job.status = 'done';
  } catch (error) {
    job.status = 'failed';
    job.error =
      error instanceof NoProvidersAvailableError
        ? { code: 'products_unavailable', message: 'No product source is reachable right now' }
        : { code: 'generation_failed', message: 'Design generation failed' };
    if (!(error instanceof NoProvidersAvailableError)) console.error(error);
  }
}
