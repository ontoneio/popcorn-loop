/**
 * Session management endpoints
 * Create and manage collaborative rooms
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { generateRoomId } from '@workspace/shared-utils';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Schema for creating a new session
const CreateSessionSchema = z.object({
  userId: z.string().min(1).max(100),
  userName: z.string().min(1).max(50),
});

// Create a new collaborative session
app.post('/', zValidator('json', CreateSessionSchema), async (c) => {
  const { userId, userName } = c.req.valid('json');
  const roomId = generateRoomId();

  // Get Durable Object stub
  const durableObjectId = c.env.COLLABORATIVE_ROOM.idFromName(roomId);
  const stub = c.env.COLLABORATIVE_ROOM.get(durableObjectId);

  // Initialize the room
  const response = await stub.fetch('http://internal/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, creatorId: userId, creatorName: userName }),
  });

  if (!response.ok) {
    return c.json({ error: 'Failed to create session' }, 500);
  }

  return c.json({
    roomId,
    wsUrl: `/api/sessions/${roomId}/ws`,
    createdAt: Date.now(),
  }, 201);
});

// Get session info
app.get('/:roomId', async (c) => {
  const roomId = c.req.param('roomId');

  // Get Durable Object stub
  const durableObjectId = c.env.COLLABORATIVE_ROOM.idFromName(roomId);
  const stub = c.env.COLLABORATIVE_ROOM.get(durableObjectId);

  const response = await stub.fetch('http://internal/state');

  if (!response.ok) {
    return c.json({ error: 'Room not found' }, 404);
  }

  return c.json(await response.json());
});

// WebSocket upgrade endpoint
app.get('/:roomId/ws', async (c) => {
  const roomId = c.req.param('roomId');
  const upgradeHeader = c.req.header('Upgrade');

  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 426);
  }

  // Get Durable Object stub
  const durableObjectId = c.env.COLLABORATIVE_ROOM.idFromName(roomId);
  const stub = c.env.COLLABORATIVE_ROOM.get(durableObjectId);

  // Forward the WebSocket upgrade request to the Durable Object
  return stub.fetch(c.req.raw);
});

export { app as sessionsRoute };
