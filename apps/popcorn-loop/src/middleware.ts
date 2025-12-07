/**
 * Hono.js application integrated with Astro middleware
 * Based on https://nuro.dev/posts/how_to_use_astro_with_hono/
 */

import { Hono } from 'hono';
import type { Env } from './types';
import { healthRoute } from './api/routes/health';
import { sessionsRoute } from './api/routes/sessions';

// Create Hono app
const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Register routes
app.route('/health', healthRoute);
app.route('/sessions', sessionsRoute);

export default app;
