import { Hono } from 'hono';
import type { APIRoute } from 'astro';
import type { Env } from '../../types';
import { sessionsRoute } from '@api/routes/sessions';

const app = new Hono<{ Bindings: Env }>().basePath('/api');
app.use(async (c, next) => {
  console.log(`hono:[${c.req.method}] ${c.req.url}`)
  await next()
})
app.route('/sessions', sessionsRoute);

export const ALL: APIRoute = (context) => app.fetch(context.request);

export type App = typeof app;