/**
 * Health check endpoint
 */

import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '0.1.0',
  });
});

export { app as healthRoute };
