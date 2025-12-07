/**
 * TypeScript types for Hono environment and Cloudflare bindings
 */

export interface Env {
  // Durable Object bindings
  COLLABORATIVE_ROOM: DurableObjectNamespace;
  
  // KV namespace (if needed in future)
  // POPCORN_LOOP_KV: KVNamespace;
  
  // Environment variables
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
}

export interface CollaborativeRoomState {
  roomId: string;
  users: Map<string, WebSocket>;
  state: unknown;
}
