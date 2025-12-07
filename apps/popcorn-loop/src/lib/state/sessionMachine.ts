/**
 * Session State Machine (XState)
 * Manages connection lifecycle and user session
 */

import { setup, assign } from 'xstate';
import type { SessionContext, SessionEvent } from '@workspace/shared-types';

export const sessionMachine = setup({
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
  },
  actions: {
    setConnectionInfo: assign({
      roomId: ({ event }) => {
        if (event.type === 'CONNECT') return event.roomId;
        return null;
      },
      userId: ({ event }) => {
        if (event.type === 'CONNECT') return event.userId;
        return null;
      },
      userName: ({ event }) => {
        if (event.type === 'CONNECT') return event.userName;
        return null;
      },
    }),
    setConnectionStatus: assign({
      connectionStatus: ({ event }) => {
        switch (event.type) {
          case 'CONNECT':
            return 'connecting' as const;
          case 'CONNECTION_ESTABLISHED':
            return 'connected' as const;
          case 'CONNECTION_FAILED':
          case 'CONNECTION_LOST':
            return 'error' as const;
          case 'RECONNECTING':
            return 'reconnecting' as const;
          case 'DISCONNECT':
            return 'disconnected' as const;
          default:
            return 'disconnected' as const;
        }
      },
    }),
    setError: assign({
      lastError: ({ event }) => {
        if (event.type === 'CONNECTION_FAILED') return event.error;
        return null;
      },
    }),
    clearSession: assign({
      roomId: () => null,
      userId: () => null,
      userName: () => null,
      connectionStatus: () => 'disconnected' as const,
      lastError: () => null,
    }),
  },
}).createMachine({
  id: 'session',
  initial: 'disconnected',
  context: {
    roomId: null,
    userId: null,
    userName: null,
    connectionStatus: 'disconnected',
    lastError: null,
  },
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: 'connecting',
          actions: ['setConnectionInfo', 'setConnectionStatus'],
        },
      },
    },
    connecting: {
      on: {
        CONNECTION_ESTABLISHED: {
          target: 'connected',
          actions: 'setConnectionStatus',
        },
        CONNECTION_FAILED: {
          target: 'error',
          actions: ['setError', 'setConnectionStatus'],
        },
        DISCONNECT: {
          target: 'disconnected',
          actions: ['clearSession', 'setConnectionStatus'],
        },
      },
    },
    connected: {
      on: {
        CONNECTION_LOST: {
          target: 'reconnecting',
          actions: 'setConnectionStatus',
        },
        DISCONNECT: {
          target: 'disconnected',
          actions: ['clearSession', 'setConnectionStatus'],
        },
      },
    },
    reconnecting: {
      on: {
        CONNECTION_ESTABLISHED: {
          target: 'connected',
          actions: 'setConnectionStatus',
        },
        CONNECTION_FAILED: {
          target: 'error',
          actions: ['setError', 'setConnectionStatus'],
        },
        DISCONNECT: {
          target: 'disconnected',
          actions: ['clearSession', 'setConnectionStatus'],
        },
      },
    },
    error: {
      on: {
        RECONNECTING: {
          target: 'reconnecting',
          actions: 'setConnectionStatus',
        },
        DISCONNECT: {
          target: 'disconnected',
          actions: ['clearSession', 'setConnectionStatus'],
        },
      },
    },
  },
});
