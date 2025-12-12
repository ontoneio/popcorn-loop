/**
 * Zod validation schemas for WebSocket messages
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const TransportPositionSchema = z.string().regex(/^\d+:\d+:\d+$/);

// ============================================================================
// Client → Server Message Schemas
// ============================================================================

export const JoinRoomSchema = z.object({
  type: z.literal('JOIN_ROOM'),
  roomId: z.string().min(1).max(100),
  userId: z.string().min(1).max(100),
  userName: z.string().min(1).max(50),
  clientTimestamp: z.number().int().positive(),
});

export const UpdateLoopSchema = z.object({
  type: z.literal('UPDATE_LOOP'),
  loopId: z.string().min(1).max(100),
  changes: z.record(z.unknown()),
  clientTimestamp: z.number().int().positive(),
  correlationId: z.string().min(1).max(100),
});

export const UpdateVisualSchema = z.object({
  type: z.literal('UPDATE_VISUAL'),
  visualId: z.string().min(1).max(100),
  changes: z.record(z.unknown()),
  clientTimestamp: z.number().int().positive(),
  correlationId: z.string().min(1).max(100),
});

export const CursorMoveSchema = z.object({
  type: z.literal('CURSOR_MOVE'),
  position: PositionSchema,
  clientTimestamp: z.number().int().positive(),
});

export const StartPlaybackSchema = z.object({
  type: z.literal('START_PLAYBACK'),
  clientTimestamp: z.number().int().positive(),
});

export const StopPlaybackSchema = z.object({
  type: z.literal('STOP_PLAYBACK'),
  clientTimestamp: z.number().int().positive(),
});

export const UndoSchema = z.object({
  type: z.literal('UNDO'),
  clientTimestamp: z.number().int().positive(),
});

export const RedoSchema = z.object({
  type: z.literal('REDO'),
  clientTimestamp: z.number().int().positive(),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  JoinRoomSchema,
  UpdateLoopSchema,
  UpdateVisualSchema,
  CursorMoveSchema,
  StartPlaybackSchema,
  StopPlaybackSchema,
  UndoSchema,
  RedoSchema,
]);

// ============================================================================
// State Data Schemas
// ============================================================================

export const AudioEventSchema = z.object({
  time: TransportPositionSchema,
  note: z.string().optional(),
  duration: z.string().optional(),
  velocity: z.number().min(0).max(1).optional(),
  synthType: z.enum(['sine', 'triangle', 'square', 'sawtooth', 'fm', 'am']).optional(),
});

export const AudioParametersSchema = z.object({
  volume: z.number().min(-60).max(12),
  pan: z.number().min(-1).max(1),
  synthType: z.enum(['sine', 'triangle', 'square', 'sawtooth', 'fm', 'am']),
  envelope: z.object({
    attack: z.number().min(0).max(2),
    decay: z.number().min(0).max(2),
    sustain: z.number().min(0).max(1),
    release: z.number().min(0).max(5),
  }),
  filter: z.object({
    type: z.enum(['lowpass', 'highpass', 'bandpass', 'notch']),
    frequency: z.number().min(20).max(20000),
    q: z.number().min(0.001).max(100),
  }).optional(),
});

export const LoopDataSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  startBar: z.number().int().min(0),
  lengthBars: z.number().int().min(1).max(16),
  audioEvents: z.array(AudioEventSchema),
  parameters: AudioParametersSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const VisualParametersSchema = z.object({
  colorPalette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  complexity: z.number().min(0).max(1),
  reactivity: z.number().min(0).max(1),
  speed: z.number().min(0).max(10),
}).catchall(z.unknown());

export const VisualDataSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  linkedLoopId: z.string().nullable(),
  sketchType: z.enum(['particles', 'waves', 'geometry', 'lines', 'noise']),
  parameters: VisualParametersSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  cursorPosition: PositionSchema,
  isConnected: z.boolean(),
  joinedAt: z.number().int().positive(),
});

export const RoomStateSchema = z.object({
  roomId: z.string(),
  users: z.array(UserSchema),
  loops: z.record(z.string(), LoopDataSchema),
  visuals: z.record(z.string(), VisualDataSchema),
  currentTurnUserId: z.string(),
  isPlaying: z.boolean(),
  transportPosition: TransportPositionSchema,
  bpm: z.number().min(60).max(200),
  loopLengthBars: z.number().int().min(4).max(16),
});

// ============================================================================
// Message Size Limits
// ============================================================================

export const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB
export const MAX_USERNAME_LENGTH = 50;
export const MAX_ROOM_ID_LENGTH = 100;
export const MAX_AUDIO_EVENTS_PER_LOOP = 1000;
export const MAX_LOOPS_PER_ROOM = 50;
export const MAX_VISUALS_PER_ROOM = 50;

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_MESSAGES = 100;
export const CURSOR_BATCH_INTERVAL_MS = 100;

// ============================================================================
// Validation Helper
// ============================================================================

export function validateClientMessage(data: unknown): {
  success: boolean;
  data?: unknown;
  error?: string;
} {
  try {
    const parsed = ClientMessageSchema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
