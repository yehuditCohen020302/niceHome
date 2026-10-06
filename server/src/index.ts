import fs from 'node:fs';
import express from 'express';
import { config } from './config';
import { errorHandler, notFoundHandler } from './errors';
import { designsRouter } from './routes/designs';
import { healthRouter } from './routes/health';
import { mockAssetsRouter } from './routes/mockAssets';
import { productsRouter, storesRouter } from './routes/products';
import { roomsRouter } from './routes/rooms';
import { generatedRouter, uploadsRouter } from './routes/uploads';
import { mockParts, startProductSources } from './services/registry';

fs.mkdirSync(config.dataDir, { recursive: true });

const app = express();
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/generated', generatedRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/designs', designsRouter);
app.use('/api/products', productsRouter);
app.use('/api/stores', storesRouter);
app.use('/api/mock-assets', mockAssetsRouter);
app.use('/api', notFoundHandler);
app.use(errorHandler);

// Bind to localhost only: the app runs on the user's own machine.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  const mocks = Object.entries(mockParts()).filter(([, isMock]) => isMock).map(([part]) => part);
  if (mocks.length > 0) console.log(`[server] still mocks (labeled in the UI): ${mocks.join(', ')}`);
  startProductSources().catch((error) => console.error('[sources] failed to start', error));
});
