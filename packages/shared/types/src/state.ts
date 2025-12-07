/**
 * State machine types and event definitions for XState actors
 */

// ============================================================================
// Session Actor Types
// ============================================================================

export interface SessionContext {
  roomId: string | null;
  userId: string | null;
  userName: string | null;
  connectionStatus: ConnectionStatus;
  lastError: string | null;
}

export type SessionEvent =
  | { type: 'CONNECT'; roomId: string; userId: string; userName: string }
  | { type: 'DISCONNECT' }
  | { type: 'CONNECTION_ESTABLISHED' }
  | { type: 'CONNECTION_FAILED'; error: string }
  | { type: 'CONNECTION_LOST' }
  | { type: 'RECONNECTING' };

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// ============================================================================
// WebSocket Actor Types
// ============================================================================

export interface WebSocketContext {
  socket: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  lastSequenceNumber: number;
  pendingMessages: PendingMessage[];
  messageQueue: unknown[];
}

export type WebSocketEvent =
  | { type: 'CONNECT'; url: string; token: string }
  | { type: 'DISCONNECT' }
  | { type: 'SEND'; message: unknown }
  | { type: 'MESSAGE_RECEIVED'; data: unknown }
  | { type: 'CONNECTION_OPENED' }
  | { type: 'CONNECTION_CLOSED'; code: number; reason: string }
  | { type: 'CONNECTION_ERROR'; error: Error }
  | { type: 'RECONNECT' }
  | { type: 'ACK_RECEIVED'; correlationId: string; success: boolean };

export interface PendingMessage {
  correlationId: string;
  message: unknown;
  timestamp: number;
}

// ============================================================================
// Sketch State Actor Types
// ============================================================================

export interface SketchStateContext {
  loops: Map<string, LoopState>;
  visuals: Map<string, VisualState>;
  users: Map<string, UserState>;
  currentTurnUserId: string | null;
  transport: TransportState;
  commandHistory: CommandHistoryState;
}

export type SketchStateEvent =
  | { type: 'ADD_LOOP'; loop: LoopState }
  | { type: 'UPDATE_LOOP'; loopId: string; changes: Partial<LoopState> }
  | { type: 'REMOVE_LOOP'; loopId: string }
  | { type: 'ADD_VISUAL'; visual: VisualState }
  | { type: 'UPDATE_VISUAL'; visualId: string; changes: Partial<VisualState> }
  | { type: 'REMOVE_VISUAL'; visualId: string }
  | { type: 'UPDATE_USER'; userId: string; changes: Partial<UserState> }
  | { type: 'ADD_USER'; user: UserState }
  | { type: 'REMOVE_USER'; userId: string }
  | { type: 'SET_TURN'; userId: string }
  | { type: 'UPDATE_TRANSPORT'; transport: Partial<TransportState> }
  | { type: 'EXECUTE_COMMAND'; command: Command }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CHECKPOINT' }
  | { type: 'SYNC_FROM_SERVER'; state: Partial<SketchStateContext> };

export interface LoopState {
  id: string;
  authorId: string;
  startBar: number;
  lengthBars: number;
  audioEvents: AudioEventState[];
  parameters: AudioParametersState;
  createdAt: number;
  updatedAt: number;
}

export interface VisualState {
  id: string;
  authorId: string;
  linkedLoopId: string | null;
  sketchType: string;
  parameters: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface UserState {
  id: string;
  name: string;
  cursorPosition: { x: number; y: number };
  isConnected: boolean;
  joinedAt: number;
}

export interface TransportState {
  position: string; // "0:0:0" format
  isPlaying: boolean;
  bpm: number;
  loopLengthBars: number;
  timeSignature: [number, number]; // [beats, noteValue] e.g., [4, 4]
}

export interface AudioEventState {
  time: string;
  note?: string;
  duration?: string;
  velocity?: number;
  synthType?: string;
}

export interface AudioParametersState {
  volume: number;
  pan: number;
  synthType: string;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    type: string;
    frequency: number;
    q: number;
  };
}

// ============================================================================
// Command Pattern Types
// ============================================================================

export interface Command {
  id: string;
  type: CommandType;
  execute(): void;
  undo(): void;
  redo(): void;
  timestamp: number;
  authorId: string;
}

export type CommandType =
  | 'ADD_LOOP'
  | 'UPDATE_LOOP'
  | 'REMOVE_LOOP'
  | 'ADD_VISUAL'
  | 'UPDATE_VISUAL'
  | 'REMOVE_VISUAL'
  | 'BATCH'; // Multiple commands grouped as transaction

export interface CommandHistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxHistorySize: number;
  lastCheckpointTimestamp: number;
}

// ============================================================================
// Turn State Machine Types
// ============================================================================

export interface TurnContext {
  currentUserId: string | null;
  userIds: string[];
  turnDurationMs: number;
  turnStartTime: number | null;
}

export type TurnEvent =
  | { type: 'START_TURN'; userId: string }
  | { type: 'END_TURN' }
  | { type: 'NEXT_TURN' }
  | { type: 'SKIP_TURN' }
  | { type: 'SET_USERS'; userIds: string[] }
  | { type: 'TIMER_EXPIRED' };

// ============================================================================
// Result Type for Error Handling
// ============================================================================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
