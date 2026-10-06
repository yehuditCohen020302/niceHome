import fs from 'node:fs';
import express from 'express';
import { config, isMockMode } from './config';
import { errorHandler, notFoundHandler } from './errors';
import { healthRouter } from './routes/health';

fs.mkdirSync(config.dataDir, { recursive: true });

const app = express();
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api', notFoundHandler);
app.use(errorHandler);

// Bind to localhost only: the app runs on the user's own machine.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  if (isMockMode()) {
    console.log('[server] mock mode: some engines/providers are mocks and are labeled as such in the UI');
  }
});
