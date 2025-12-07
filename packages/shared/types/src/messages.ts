/**
 * WebSocket message types for real-time collaboration
 * Server-authoritative with sequence numbering for ordering
 */

export type WebSocketMessage =
  | ClientMessage
  | ServerMessage;

// ============================================================================
// Client → Server Messages
// ============================================================================

export type ClientMessage =
  | JoinRoomMessage
  | UpdateLoopMessage
  | UpdateVisualMessage
  | CursorMoveMessage
  | StartPlaybackMessage
  | StopPlaybackMessage
  | UndoMessage
  | RedoMessage;

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  roomId: string;
  userId: string;
  userName: string;
  clientTimestamp: number;
}

export interface UpdateLoopMessage {
  type: 'UPDATE_LOOP';
  loopId: string;
  changes: Partial<LoopData>;
  clientTimestamp: number;
  correlationId: string; // For optimistic update tracking
}

export interface UpdateVisualMessage {
  type: 'UPDATE_VISUAL';
  visualId: string;
  changes: Partial<VisualData>;
  clientTimestamp: number;
  correlationId: string;
}

export interface CursorMoveMessage {
  type: 'CURSOR_MOVE';
  position: { x: number; y: number };
  clientTimestamp: number;
}

export interface StartPlaybackMessage {
  type: 'START_PLAYBACK';
  clientTimestamp: number;
}

export interface StopPlaybackMessage {
  type: 'STOP_PLAYBACK';
  clientTimestamp: number;
}

export interface UndoMessage {
  type: 'UNDO';
  clientTimestamp: number;
}

export interface RedoMessage {
  type: 'REDO';
  clientTimestamp: number;
}

// ============================================================================
// Server → Client Messages
// ============================================================================

export type ServerMessage =
  | WelcomeMessage
  | StateUpdateMessage
  | LoopUpdatedMessage
  | VisualUpdatedMessage
  | CursorUpdatedMessage
  | PlaybackStartedMessage
  | PlaybackStoppedMessage
  | TransportSyncMessage
  | TurnChangedMessage
  | UserJoinedMessage
  | UserLeftMessage
  | ErrorMessage
  | AckMessage;

export interface WelcomeMessage {
  type: 'WELCOME';
  userId: string;
  roomState: RoomState;
  serverSequence: number;
  serverTimestamp: number;
}

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  roomState: RoomState;
  serverSequence: number;
  serverTimestamp: number;
}

export interface LoopUpdatedMessage {
  type: 'LOOP_UPDATED';
  loopId: string;
  changes: Partial<LoopData>;
  authorId: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface VisualUpdatedMessage {
  type: 'VISUAL_UPDATED';
  visualId: string;
  changes: Partial<VisualData>;
  authorId: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface CursorUpdatedMessage {
  type: 'CURSOR_UPDATED';
  userId: string;
  position: { x: number; y: number };
  serverSequence: number;
  serverTimestamp: number;
}

export interface PlaybackStartedMessage {
  type: 'PLAYBACK_STARTED';
  transportPosition: string; // Tone.js position format "0:0:0"
  serverSequence: number;
  serverTimestamp: number;
}

export interface PlaybackStoppedMessage {
  type: 'PLAYBACK_STOPPED';
  transportPosition: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface TransportSyncMessage {
  type: 'TRANSPORT_SYNC';
  transportPosition: string;
  isPlaying: boolean;
  bpm: number;
  serverSequence: number;
  serverTimestamp: number;
}

export interface TurnChangedMessage {
  type: 'TURN_CHANGED';
  currentTurnUserId: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface UserJoinedMessage {
  type: 'USER_JOINED';
  user: User;
  serverSequence: number;
  serverTimestamp: number;
}

export interface UserLeftMessage {
  type: 'USER_LEFT';
  userId: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface ErrorMessage {
  type: 'ERROR';
  code: ErrorCode;
  message: string;
  serverSequence: number;
  serverTimestamp: number;
}

export interface AckMessage {
  type: 'ACK';
  correlationId: string;
  success: boolean;
  serverSequence: number;
  serverTimestamp: number;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface RoomState {
  roomId: string;
  users: User[];
  loops: Record<string, LoopData>;
  visuals: Record<string, VisualData>;
  currentTurnUserId: string;
  isPlaying: boolean;
  transportPosition: string;
  bpm: number;
  loopLengthBars: number;
}

export interface User {
  id: string;
  name: string;
  cursorPosition: { x: number; y: number };
  isConnected: boolean;
  joinedAt: number;
}

export interface LoopData {
  id: string;
  authorId: string;
  startBar: number;
  lengthBars: number;
  audioEvents: AudioEvent[];
  parameters: AudioParameters;
  createdAt: number;
  updatedAt: number;
}

export interface VisualData {
  id: string;
  authorId: string;
  linkedLoopId: string | null;
  sketchType: SketchType;
  parameters: VisualParameters;
  createdAt: number;
  updatedAt: number;
}

export interface AudioEvent {
  time: string; // Tone.js position format relative to loop start
  note?: string; // e.g., "C4", "D#5"
  duration?: string; // e.g., "8n", "4n"
  velocity?: number; // 0-1
  synthType?: SynthType;
}

export interface AudioParameters {
  volume: number; // dB
  pan: number; // -1 to 1
  synthType: SynthType;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    type: FilterType;
    frequency: number;
    q: number;
  };
}

export interface VisualParameters {
  colorPalette: string[]; // Hex colors
  complexity: number; // 0-1
  reactivity: number; // 0-1 (how much audio affects visuals)
  speed: number; // Animation speed multiplier
  [key: string]: unknown; // Sketch-specific parameters
}

export type SynthType = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'fm' | 'am';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type SketchType = 'particles' | 'waves' | 'geometry' | 'lines' | 'noise';

export type ErrorCode =
  | 'NOT_YOUR_TURN'
  | 'INVALID_MESSAGE'
  | 'ROOM_FULL'
  | 'ROOM_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';
