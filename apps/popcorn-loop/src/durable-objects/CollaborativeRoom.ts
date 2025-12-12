/**
 * Collaborative Room Durable Object
 * Manages WebSocket connections and server-authoritative state for a single room
 * Uses WebSocket Hibernation API for cost-effective idle connections
 */

import type { DurableObject } from 'cloudflare:workers';
import type {
  ClientMessage,
  ServerMessage,
  RoomState,
  User,
  LoopData,
  VisualData,
} from '@workspace/shared/types';
import { validateClientMessage, RATE_LIMIT_MAX_MESSAGES, RATE_LIMIT_WINDOW_MS } from '@workspace/shared-validators';

interface SessionData {
  userId: string;
  userName: string;
  joinedAt: number;
  messageCount: number;
  lastMessageTime: number;
}

export class CollaborativeRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, SessionData> = new Map();
  private roomState: RoomState | null = null;
  private sequenceNumber = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    
    // Block concurrent requests during initialization
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<RoomState>('roomState');
      if (stored) {
        this.roomState = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle internal initialization
    if (url.pathname === '/init' && request.method === 'POST') {
      return this.handleInit(request);
    }

    // Handle state query
    if (url.pathname === '/state' && request.method === 'GET') {
      return this.handleGetState();
    }

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Initialize a new room
   */
  private async handleInit(request: Request): Promise<Response> {
    const data = await request.json<{ roomId: string; creatorId: string; creatorName: string }>();

    if (this.roomState) {
      return new Response('Room already initialized', { status: 409 });
    }

    this.roomState = {
      roomId: data.roomId,
      users: [],
      loops: {},
      visuals: {},
      currentTurnUserId: data.creatorId,
      isPlaying: false,
      transportPosition: '0:0:0',
      bpm: 120,
      loopLengthBars: 4,
    };

    await this.state.storage.put('roomState', this.roomState);

    return new Response('OK', { status: 200 });
  }

  /**
   * Get current room state
   */
  private handleGetState(): Response {
    if (!this.roomState) {
      return new Response('Room not initialized', { status: 404 });
    }

    return new Response(JSON.stringify(this.roomState), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handle WebSocket connection upgrade
   */
  private handleWebSocket(request: Request): Response {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');

    if (!userId || !userName) {
      return new Response('Missing userId or userName', { status: 400 });
    }

    // TODO: Validate JWT token from query string
    // const token = url.searchParams.get('token');

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection using Hibernation API
    this.state.acceptWebSocket(server);

    // Store session data
    const sessionData: SessionData = {
      userId,
      userName,
      joinedAt: Date.now(),
      messageCount: 0,
      lastMessageTime: Date.now(),
    };
    this.sessions.set(server, sessionData);

    // Send welcome message
    this.sendWelcome(server, userId, userName);

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Send welcome message to newly connected client
   */
  private sendWelcome(ws: WebSocket, userId: string, userName: string): void {
    if (!this.roomState) return;

    // Add user to room state
    const user: User = {
      id: userId,
      name: userName,
      cursorPosition: { x: 0, y: 0 },
      isConnected: true,
      joinedAt: Date.now(),
    };

    this.roomState.users.push(user);
    this.persistState();

    // Send welcome with full state
    const welcome: ServerMessage = {
      type: 'WELCOME',
      userId,
      roomState: this.roomState,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    };

    ws.send(JSON.stringify(welcome));

    // Broadcast user joined to others
    this.broadcast({
      type: 'USER_JOINED',
      user,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    }, ws);
  }

  /**
   * Handle incoming WebSocket message
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session || !this.roomState) return;

    // Rate limiting
    const now = Date.now();
    if (now - session.lastMessageTime > RATE_LIMIT_WINDOW_MS) {
      session.messageCount = 0;
      session.lastMessageTime = now;
    }

    session.messageCount++;
    if (session.messageCount > RATE_LIMIT_MAX_MESSAGES) {
      this.sendError(ws, 'RATE_LIMITED', 'Too many messages');
      return;
    }

    // Parse and validate message
    let data: unknown;
    try {
      data = typeof message === 'string' ? JSON.parse(message) : message;
    } catch {
      this.sendError(ws, 'INVALID_MESSAGE', 'Invalid JSON');
      return;
    }

    const validation = validateClientMessage(data);
    if (!validation.success) {
      this.sendError(ws, 'VALIDATION_ERROR', validation.error || 'Invalid message format');
      return;
    }

    const clientMessage = validation.data as ClientMessage;

    // Handle message based on type
    switch (clientMessage.type) {
      case 'UPDATE_LOOP':
        this.handleUpdateLoop(ws, clientMessage, session);
        break;
      case 'UPDATE_VISUAL':
        this.handleUpdateVisual(ws, clientMessage, session);
        break;
      case 'CURSOR_MOVE':
        this.handleCursorMove(ws, clientMessage, session);
        break;
      case 'START_PLAYBACK':
        this.handleStartPlayback(ws, session);
        break;
      case 'STOP_PLAYBACK':
        this.handleStopPlayback(ws, session);
        break;
      case 'UNDO':
        this.handleUndo(ws, session);
        break;
      case 'REDO':
        this.handleRedo(ws, session);
        break;
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session || !this.roomState) return;

    // Remove user from room state
    this.roomState.users = this.roomState.users.filter((u) => u.id !== session.userId);
    this.sessions.delete(ws);
    await this.persistState();

    // Broadcast user left
    this.broadcast({
      type: 'USER_LEFT',
      userId: session.userId,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    ws.close(1011, 'Internal error');
  }

  // ============================================================================
  // Message Handlers
  // ============================================================================

  private handleUpdateLoop(ws: WebSocket, msg: ClientMessage & { type: 'UPDATE_LOOP' }, session: SessionData): void {
    if (!this.roomState) return;

    // Check turn authorization
    if (this.roomState.currentTurnUserId !== session.userId) {
      this.sendError(ws, 'NOT_YOUR_TURN', 'It is not your turn');
      return;
    }

    // Apply changes
    if (!this.roomState.loops[msg.loopId]) {
      // Create new loop
      this.roomState.loops[msg.loopId] = {
        id: msg.loopId,
        authorId: session.userId,
        startBar: 0,
        lengthBars: 4,
        audioEvents: [],
        parameters: {
          volume: -12,
          pan: 0,
          synthType: 'sine',
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...msg.changes,
      } as LoopData;
    } else {
      // Update existing loop
      Object.assign(this.roomState.loops[msg.loopId], msg.changes, { updatedAt: Date.now() });
    }

    this.persistState();

    // Broadcast update
    this.broadcast({
      type: 'LOOP_UPDATED',
      loopId: msg.loopId,
      changes: msg.changes,
      authorId: session.userId,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });

    // Send ACK
    ws.send(JSON.stringify({
      type: 'ACK',
      correlationId: msg.correlationId,
      success: true,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    }));
  }

  private handleUpdateVisual(ws: WebSocket, msg: ClientMessage & { type: 'UPDATE_VISUAL' }, session: SessionData): void {
    if (!this.roomState) return;

    if (this.roomState.currentTurnUserId !== session.userId) {
      this.sendError(ws, 'NOT_YOUR_TURN', 'It is not your turn');
      return;
    }

    // Apply changes (similar to loop)
    if (!this.roomState.visuals[msg.visualId]) {
      this.roomState.visuals[msg.visualId] = {
        id: msg.visualId,
        authorId: session.userId,
        linkedLoopId: null,
        sketchType: 'particles',
        parameters: { colorPalette: ['#FF0000'], complexity: 0.5, reactivity: 0.5, speed: 1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...msg.changes,
      } as VisualData;
    } else {
      Object.assign(this.roomState.visuals[msg.visualId], msg.changes, { updatedAt: Date.now() });
    }

    this.persistState();

    this.broadcast({
      type: 'VISUAL_UPDATED',
      visualId: msg.visualId,
      changes: msg.changes,
      authorId: session.userId,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });

    ws.send(JSON.stringify({
      type: 'ACK',
      correlationId: msg.correlationId,
      success: true,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    }));
  }

  private handleCursorMove(ws: WebSocket, msg: ClientMessage & { type: 'CURSOR_MOVE' }, session: SessionData): void {
    // Update cursor position (don't persist, just broadcast)
    this.broadcast({
      type: 'CURSOR_UPDATED',
      userId: session.userId,
      position: msg.position,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    }, ws);
  }

  private handleStartPlayback(ws: WebSocket, session: SessionData): void {
    if (!this.roomState) return;
    
    this.roomState.isPlaying = true;
    this.persistState();

    this.broadcast({
      type: 'PLAYBACK_STARTED',
      transportPosition: this.roomState.transportPosition,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });
  }

  private handleStopPlayback(ws: WebSocket, session: SessionData): void {
    if (!this.roomState) return;
    
    this.roomState.isPlaying = false;
    this.persistState();

    this.broadcast({
      type: 'PLAYBACK_STOPPED',
      transportPosition: this.roomState.transportPosition,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });
  }

  private handleUndo(ws: WebSocket, session: SessionData): void {
    // TODO: Implement command history
    this.sendError(ws, 'INTERNAL_ERROR', 'Undo not yet implemented');
  }

  private handleRedo(ws: WebSocket, session: SessionData): void {
    // TODO: Implement command history
    this.sendError(ws, 'INTERNAL_ERROR', 'Redo not yet implemented');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private sendError(ws: WebSocket, code: string, message: string): void {
    ws.send(JSON.stringify({
      type: 'ERROR',
      code,
      message,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    }));
  }

  private broadcast(message: ServerMessage, exclude?: WebSocket): void {
    const serialized = JSON.stringify(message);
    
    for (const [ws, session] of this.sessions.entries()) {
      if (ws !== exclude) {
        try {
          ws.send(serialized);
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }
    }
  }

  private async persistState(): Promise<void> {
    if (this.roomState) {
      await this.state.storage.put('roomState', this.roomState);
    }
  }

  /**
   * Periodic alarm for syncing transport position
   */
  async alarm(): Promise<void> {
    if (!this.roomState || !this.roomState.isPlaying) return;

    // Broadcast transport sync every 16th note
    // In production, calculate actual position based on elapsed time
    this.broadcast({
      type: 'TRANSPORT_SYNC',
      transportPosition: this.roomState.transportPosition,
      isPlaying: this.roomState.isPlaying,
      bpm: this.roomState.bpm,
      serverSequence: this.sequenceNumber++,
      serverTimestamp: Date.now(),
    });

    // Schedule next sync (roughly 125ms at 120 BPM for 16th note)
    const msPerBeat = (60 / this.roomState.bpm) * 1000;
    const msPerSixteenth = msPerBeat / 4;
    await this.state.storage.setAlarm(Date.now() + msPerSixteenth);
  }
}
