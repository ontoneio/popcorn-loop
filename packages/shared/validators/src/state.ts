/**
 * Zod validation schemas for state data
 */

import { z } from 'zod';

// ============================================================================
// Command Validation
// ============================================================================

export const CommandTypeSchema = z.enum([
  'ADD_LOOP',
  'UPDATE_LOOP',
  'REMOVE_LOOP',
  'ADD_VISUAL',
  'UPDATE_VISUAL',
  'REMOVE_VISUAL',
  'BATCH',
]);

// ============================================================================
// Transport State Validation
// ============================================================================

export const TransportStateSchema = z.object({
  position: z.string().regex(/^\d+:\d+:\d+$/),
  isPlaying: z.boolean(),
  bpm: z.number().min(60).max(200),
  loopLengthBars: z.number().int().min(4).max(16),
  timeSignature: z.tuple([
    z.number().int().min(1).max(16),
    z.number().int().refine((val) => [2, 4, 8, 16].includes(val)),
  ]),
});

// ============================================================================
// Audio Event Validation
// ============================================================================

export const NoteSchema = z.string().regex(/^[A-G][#b]?\d$/);

export const DurationSchema = z.enum([
  '1n', '2n', '4n', '8n', '16n', '32n',
  '1m', '2m', '4m', '8m', '16m',
  '1t', '2t', '4t', '8t', '16t',
]);

export const ScheduledAudioEventSchema = z.object({
  id: z.string(),
  loopId: z.string(),
  time: z.string(),
  absoluteTime: z.string(),
  type: z.enum(['note', 'chord', 'sample', 'effect_change', 'volume_change', 'pan_change']),
  data: z.unknown(), // Type depends on event type
});

// ============================================================================
// Visual Event Validation
// ============================================================================

export const EasingTypeSchema = z.enum([
  'linear',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
]);

export const ScheduledVisualEventSchema = z.object({
  id: z.string(),
  visualId: z.string(),
  time: z.string(),
  absoluteTime: z.string(),
  type: z.enum(['parameter_change', 'trigger_animation', 'spawn_element', 'clear_canvas']),
  data: z.unknown(),
});

// ============================================================================
// Performance Metrics Validation
// ============================================================================

export const PerformanceMetricsSchema = z.object({
  audioLatencyMs: z.number().min(0).max(1000),
  visualFrameRate: z.number().min(0).max(144),
  droppedFrames: z.number().int().min(0),
  websocketLatencyMs: z.number().min(0).max(5000),
  lastUpdated: z.number().int().positive(),
});

// ============================================================================
// Latency Compensation Validation
// ============================================================================

export const LatencyCompensationSchema = z.object({
  clientToServerMs: z.number().min(0).max(5000),
  serverToClientMs: z.number().min(0).max(5000),
  totalRoundTripMs: z.number().min(0).max(10000),
  clockOffsetMs: z.number().min(-5000).max(5000),
  lastMeasured: z.number().int().positive(),
});

// ============================================================================
// Security Constants
// ============================================================================

export const SECURITY = {
  MAX_CONNECTIONS_PER_USER: 5,
  IDLE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // 30 seconds
  JWT_REVALIDATION_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  MAX_MESSAGE_SIZE_BYTES: 64 * 1024, // 64KB
} as const;

// ============================================================================
// Timing Constants
// ============================================================================

export const TIMING = {
  TRANSPORT_SYNC_INTERVAL: '16n', // Broadcast position every 16th note
  CURSOR_BATCH_MS: 100,
  STATE_CHECKPOINT_MS: 30 * 1000, // 30 seconds
  COMMAND_HISTORY_MAX: 100,
  RECONNECT_BASE_DELAY_MS: 500,
  RECONNECT_MAX_DELAY_MS: 30 * 1000,
  RECONNECT_JITTER_MS: 1000,
} as const;
