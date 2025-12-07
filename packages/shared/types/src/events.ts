/**
 * Audio and visual event types for timeline scheduling
 */

// ============================================================================
// Audio Event Types
// ============================================================================

export interface ScheduledAudioEvent {
  id: string;
  loopId: string;
  time: string; // Tone.js position format "bar:beat:sixteenth"
  absoluteTime: string; // Absolute position in composition
  type: AudioEventType;
  data: AudioEventData;
}

export type AudioEventType =
  | 'note'
  | 'chord'
  | 'sample'
  | 'effect_change'
  | 'volume_change'
  | 'pan_change';

export type AudioEventData =
  | NoteEventData
  | ChordEventData
  | SampleEventData
  | EffectChangeEventData
  | VolumeChangeEventData
  | PanChangeEventData;

export interface NoteEventData {
  note: string; // e.g., "C4", "D#5"
  duration: string; // e.g., "8n", "4n"
  velocity: number; // 0-1
  synthType: string;
}

export interface ChordEventData {
  notes: string[]; // Array of notes
  duration: string;
  velocity: number;
  synthType: string;
}

export interface SampleEventData {
  sampleId: string;
  playbackRate: number;
  offset: number; // Start position in sample
  duration?: string;
}

export interface EffectChangeEventData {
  effectType: EffectType;
  parameters: Record<string, number>;
}

export interface VolumeChangeEventData {
  volume: number; // dB
  rampTime?: string; // e.g., "0.5" for 500ms ramp
}

export interface PanChangeEventData {
  pan: number; // -1 to 1
  rampTime?: string;
}

export type EffectType =
  | 'filter'
  | 'reverb'
  | 'delay'
  | 'distortion'
  | 'chorus'
  | 'phaser';

// ============================================================================
// Visual Event Types
// ============================================================================

export interface ScheduledVisualEvent {
  id: string;
  visualId: string;
  time: string; // Tone.js position format
  absoluteTime: string;
  type: VisualEventType;
  data: VisualEventData;
}

export type VisualEventType =
  | 'parameter_change'
  | 'trigger_animation'
  | 'spawn_element'
  | 'clear_canvas';

export type VisualEventData =
  | ParameterChangeEventData
  | TriggerAnimationEventData
  | SpawnElementEventData
  | ClearCanvasEventData;

export interface ParameterChangeEventData {
  parameter: string;
  value: unknown;
  tweenDuration?: number; // milliseconds
  easing?: EasingType;
}

export interface TriggerAnimationEventData {
  animationName: string;
  parameters?: Record<string, unknown>;
}

export interface SpawnElementEventData {
  elementType: string;
  position: { x: number; y: number };
  properties: Record<string, unknown>;
}

export interface ClearCanvasEventData {
  fadeOut?: number; // milliseconds for fade out
}

export type EasingType =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

// ============================================================================
// Timeline Types
// ============================================================================

export interface Timeline {
  id: string;
  audioEvents: ScheduledAudioEvent[];
  visualEvents: ScheduledVisualEvent[];
  loopLengthBars: number;
  bpm: number;
  timeSignature: [number, number];
}

export interface TimelineMarker {
  id: string;
  position: string; // Tone.js position
  label: string;
  color?: string;
}

// ============================================================================
// Synchronization Types
// ============================================================================

export interface SyncData {
  transportPosition: string;
  isPlaying: boolean;
  bpm: number;
  serverTimestamp: number;
  clientTimestamp: number;
  roundTripTime?: number;
}

export interface LatencyCompensation {
  clientToServerMs: number;
  serverToClientMs: number;
  totalRoundTripMs: number;
  clockOffsetMs: number;
  lastMeasured: number;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export interface PerformanceMetrics {
  audioLatencyMs: number;
  visualFrameRate: number;
  droppedFrames: number;
  websocketLatencyMs: number;
  lastUpdated: number;
}
