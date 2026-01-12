import express from 'express';
import { Pool } from 'pg';
import { pool as defaultPool } from './db/pool';
import { sendSuccess } from './lib/envelope';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestIdMiddleware } from './middleware/requestId';
import { demoRouter } from './routes/demo';
import { usersRouter } from './routes/users';

export function createApp(opts?: { pool?: Pool }) {
  const pool = opts?.pool ?? defaultPool;
  const app = express();

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }));

  app.use('/api/users', usersRouter({ pool }));
  app.use('/api/demo', demoRouter());

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
