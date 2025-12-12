# Popcorn Loop - AI Agent Instructions

## Project Overview

**Popcorn Loop** is a real-time collaborative audio/visual loop creation tool for 2-4 users. Users take turns creating synchronized audio loops (Tone.js) with generative visual sketches (P5.js) in 4-16 second musical bar-based compositions. The application uses server-authoritative WebSocket collaboration with Cloudflare Durable Objects, Tone.js Transport as the master clock, and XState actors for state management.

**Target Users**: Musicians, visual artists, creative coders exploring collaborative audio-visual composition.

**Key Features**:
- Real-time 2-4 person collaborative sessions with turn-based interaction
- Audio synthesis and loop recording using Tone.js (4-16 second loops, quantized to musical bars)
- Generative visual sketches using P5.js synchronized to audio timeline
- Server-authoritative state with delta patches and optimistic updates
- Undo/redo using command pattern
- WebSocket communication via Cloudflare Durable Objects with Hibernation API

## Tech Stack

### Frontend (apps/popcorn-loop)
- **Framework**: Astro 5.16.4 (SSR + Islands architecture)
- **UI Components**: Solid.js (for reactive audio/visual controls)
- **Audio**: Tone.js ^15.0.0 (Web Audio synthesis, Transport master clock)
- **Visuals**: P5.js ^1.10.0 (generative sketches on canvas)
- **Animation**: Anime.js ^3.2.2 (timeline animations synced via Tone.Draw)
- **State Management**: XState ^5.19.0 (actor model for session/WebSocket/sketch state)
- **Validation**: Zod ^3.24.0 (runtime type validation)
- **Deployment**: Cloudflare Pages/Workers via @astrojs/cloudflare

### Backend (Integrated with Astro)
- **API Framework**: Hono.js ^4.6.0 (integrated via Astro middleware)
- **WebSocket**: Cloudflare Durable Objects with WebSocket Hibernation API
- **Real-time**: Server-authoritative with delta patches, sequence numbering
- **Validation**: @hono/zod-validator for API input validation

### Shared Packages (libs/shared/)
- **@workspace/shared/types**: TypeScript interfaces for messages, state, events
- **@workspace/shared-validators**: Zod schemas for runtime validation (client + server)
- **@workspace/shared-utils**: Common utilities (timing conversions, ID generation)

### Development Tools
- **Monorepo**: pnpm workspaces 10.18.3 + Nx 22.1.3
- **Testing**: Vitest ^2.1.0 (unit tests), Playwright ^1.48.0 (E2E)
- **Linting**: ESLint ^9.0.0 with TypeScript parser
- **Formatting**: Prettier ^3.3.0
- **Type Checking**: TypeScript 5.7.0 (strict mode)

## Build and Test Commands

### Development
```bash
# Start Astro dev server with Hono.js API (http://localhost:4321)
cd apps/popcorn-loop && pnpm dev

# Start Wrangler local development with Durable Objects
cd apps/popcorn-loop && pnpm wrangler:dev

# Run all tests (unit + integration)
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check all packages
pnpm type-check
```

### Build and Deploy
```bash
# Build all packages
pnpm build

# Build Astro app for production
cd apps/popcorn-loop && pnpm build

# Preview production build locally
cd apps/popcorn-loop && pnpm preview

# Deploy to Cloudflare (requires wrangler auth)
cd apps/popcorn-loop && pnpm wrangler deploy
```

### Code Quality
```bash
# Lint all files
pnpm lint

# Format all files
pnpm format

# Fix linting issues automatically
pnpm lint:fix
```

## Repository Structure

```
popcorn-loop/
├── apps/
│   └── popcorn-loop/              # Main Astro application
│       ├── src/
│       │   ├── middleware.ts      # Hono.js integration point
│       │   ├── pages/             # Astro pages (index.astro = main app)
│       │   ├── components/        # Solid.js components (UI controls, canvas)
│       │   ├── api/               # Hono.js API routes
│       │   │   ├── routes/        # REST endpoints (sessions, users)
│       │   │   └── ws/            # WebSocket upgrade handlers
│       │   ├── durable-objects/   # Cloudflare Durable Objects
│       │   │   └── CollaborativeRoom.ts  # Room state + WebSocket handler
│       │   ├── lib/               # Frontend libraries
│       │   │   ├── audio/         # Tone.js wrappers (TransportManager, synths)
│       │   │   ├── visual/        # P5.js sketches and managers
│       │   │   ├── state/         # XState actors and machines
│       │   │   ├── websocket/     # WebSocket client manager
│       │   │   └── commands/      # Command pattern for undo/redo
│       │   └── types/             # App-specific TypeScript types
│       ├── public/                # Static assets (favicon, audio samples)
│       ├── astro.config.mjs       # Astro configuration
│       ├── wrangler.jsonc         # Cloudflare Wrangler config (DO bindings)
│       └── package.json           # App dependencies and scripts
├── libs/
│   └── shared/                    # Shared code used by frontend + backend
│       ├── types/                 # @workspace/shared/types
│       │   ├── src/
│       │   │   ├── messages.ts    # WebSocket message types
│       │   │   ├── state.ts       # Collaborative state types
│       │   │   ├── events.ts      # Audio/visual event types
│       │   │   └── index.ts       # Barrel exports
│       │   └── package.json
│       ├── validators/            # @workspace/shared-validators
│       │   ├── src/
│       │   │   ├── messages.ts    # Zod schemas for WebSocket messages
│       │   │   ├── state.ts       # State validation schemas
│       │   │   └── index.ts       # Barrel exports
│       │   └── package.json
│       └── utils/                 # @workspace/shared-utils
│           ├── src/
│           │   ├── timing.ts      # Transport position ↔ ms/frame conversions
│           │   ├── ids.ts         # UUID/nanoid generation
│           │   └── index.ts       # Barrel exports
│           └── package.json
├── .github/
│   └── instructions/              # Path-specific AI instructions (optional)
├── tsconfig.base.json             # Base TypeScript config with path aliases
├── nx.json                        # Nx configuration
├── pnpm-workspace.yaml            # pnpm workspace definition
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── vitest.config.ts               # Vitest test configuration
└── playwright.config.ts           # Playwright E2E configuration
```

## Code Standards

### Naming Conventions
- **Files**: kebab-case (`collaborative-room.ts`, `transport-manager.ts`)
- **Components**: PascalCase (`LoopControls.tsx`, `VisualCanvas.tsx`)
- **Functions/Variables**: camelCase (`getCurrentTransportPosition`, `isUsersTurn`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_USERS_PER_ROOM`, `DEFAULT_BPM`)
- **Types/Interfaces**: PascalCase (`WebSocketMessage`, `LoopState`)
- **Enums**: PascalCase with SCREAMING_SNAKE_CASE values

### TypeScript Requirements
- **Strict mode enabled**: All code must pass `strict: true` TypeScript checks
- **Explicit return types**: All exported functions must declare return types
- **No `any` types**: Use `unknown` with type guards or proper generics
- **Zod validation**: Runtime validate all external inputs (WebSocket messages, API requests)
- **Shared types**: Import from `@workspace/shared/types` for cross-boundary types

### Testing Expectations
- **Unit tests**: All shared utilities and pure functions (aim for >80% coverage)
- **Integration tests**: XState machines, WebSocket message flows, command pattern
- **E2E tests**: Critical user flows (create session, join room, add loop, playback sync)
- **Test file naming**: `*.test.ts` for unit tests, `*.spec.ts` for integration tests
- **Mock external services**: Use Vitest mocks for Tone.js, P5.js in unit tests

### Audio/Visual Synchronization Rules
- **Single source of truth**: Tone.js Transport is the ONLY timing authority
- **No direct setTimeout/setInterval**: Always use `Tone.Draw.schedule()` or `Transport.schedule()`
- **Frame-accurate scheduling**: Schedule audio events, then bridge to visuals via `Tone.Draw`
- **Resolution**: Use 16th note (16n) granularity for scheduling (balance latency vs precision)
- **Position format**: Use Tone.js transport position format (`"0:0:0"` = bar:beat:sixteenth)

### WebSocket Communication Standards
- **Message structure**: All messages must conform to `@workspace/shared-validators` schemas
- **Authentication**: Validate JWT on connection + re-validate every 30 minutes
- **Authorization**: Check permissions on EVERY action, not just connection
- **Rate limiting**: Max 100 messages/minute per user
- **Batching**: Collect rapid updates (cursor movements) over 100ms windows
- **Sequence numbers**: Server assigns monotonic sequence IDs to all broadcast messages
- **Optimistic updates**: Apply locally, track with correlation IDs, rollback on rejection

### State Management Patterns
- **XState actors**: Separate actors for session management, WebSocket, and sketch state
- **Typed events**: All state machine events must have TypeScript interfaces
- **Command pattern**: Every state mutation is a reversible command (execute/undo/redo)
- **Immutable updates**: Use structural sharing, never mutate state directly
- **Server-authoritative**: Client predictions always defer to server's canonical state

### Error Handling
- **Result types**: Use `Result<T, E>` pattern for fallible operations (avoid throwing)
- **User-facing errors**: Show actionable error messages, not stack traces
- **WebSocket reconnection**: Exponential backoff (500ms base, 30s max, ±1s jitter)
- **Audio context failures**: Detect suspended context, prompt user interaction to resume
- **Validation failures**: Log validation errors with context, reject invalid messages

### Security Requirements
- **Transport**: Always use WSS (never ws://), TLS 1.2+
- **Origin validation**: Check Origin header against explicit allowlist on handshake
- **JWT verification**: Verify signature using JWKS endpoint before accepting connections
- **DoS protection**: Connection limits per user (5 max), idle timeouts (5 minutes)
- **Message size limits**: Reject messages over 64KB
- **Sanitize inputs**: Never trust client-provided data, validate with Zod before processing

### Performance Guidelines
- **Bundle size**: Keep initial JS bundle under 200KB (use code splitting for audio/visual)
- **Audio latency**: Target <50ms from user action to sound (requires lookahead scheduling)
- **Visual frame rate**: Maintain 60 FPS for animations (use `requestAnimationFrame` via Tone.Draw)
- **WebSocket reconnection**: Resume from last sequence number, fallback to full state sync
- **Lazy loading**: Load audio samples and P5.js sketches on-demand, not at startup

## Implementation Notes

### Hono.js + Astro Integration Pattern
Follow [nuro.dev's guide](https://nuro.dev/posts/how_to_use_astro_with_hono/):
1. Create `src/middleware.ts` exporting Hono app as Astro middleware
2. Define API routes in `src/api/routes/`, mount to Hono app
3. Use `upgradeWebSocket` from `hono/cloudflare-workers` for WebSocket upgrade
4. Hono handles `/api/*` routes, Astro handles page rendering

### Durable Objects Configuration
In `wrangler.jsonc`:
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COLLABORATIVE_ROOM",
        "class_name": "CollaborativeRoom",
        "script_name": "popcorn-loop"
      }
    ]
  }
}
```

### Tone.js Transport as Master Clock
```typescript
// Set up Transport
Transport.bpm.value = 120;
Transport.loop = true;
Transport.loopEnd = "4m"; // 4 bars

// Schedule audio
Transport.scheduleRepeat((time) => {
  playAudioEvent(time);
  // Bridge to visuals
  Tone.Draw.schedule(() => {
    updateVisuals(Transport.position);
  }, time);
}, "16n");
```

### Command Pattern for Undo/Redo
```typescript
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

class AddLoopCommand implements Command {
  constructor(private loopData: LoopData) {}
  execute() { /* add loop */ }
  undo() { /* remove loop */ }
  redo() { this.execute(); }
}
```

## Verification Steps

### Feature Acceptance Criteria
Each feature implementation must satisfy:
1. **Type safety**: No TypeScript errors in strict mode
2. **Tests pass**: `pnpm test` shows all green
3. **Manual verification**: Documented steps to verify feature works
4. **Performance**: Meets latency/FPS targets from guidelines
5. **Security**: Passes security checklist (auth, validation, rate limiting)

### Manual Testing Checklist
- [ ] Open two browser windows, join same room
- [ ] Verify Transport stays synchronized within 50ms across clients
- [ ] Add audio loop, confirm visual updates match audio timing
- [ ] Test undo/redo on multiple operations
- [ ] Disconnect/reconnect, verify state resumes correctly
- [ ] Exceed rate limit, verify client is throttled
- [ ] Invalid message format, verify server rejects gracefully

### Pre-Deployment Checklist
- [ ] All tests passing (`pnpm test && pnpm test:e2e`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] Linting clean (`pnpm lint`)
- [ ] Bundle size under 200KB initial load
- [ ] Wrangler config has correct DO bindings
- [ ] Environment variables documented in README
- [ ] Audio context resumes on user interaction
- [ ] WebSocket reconnection tested with network throttling

## Architectural Decisions

### Why Server-Authoritative Instead of CRDT?
CRDTs add complexity unnecessary for 2-4 user turn-based collaboration. Server-authoritative with delta patches is simpler, easier to reason about, and sufficient for our scale. Last-writer-wins with server timestamps resolves conflicts.

### Why Tone.js Transport as Master Clock?
JavaScript timing (`setTimeout`) is unreliable for audio due to GC pauses and task scheduling. Web Audio's clock is hardware-based and sample-accurate. Using Transport as single source of truth eliminates audio-visual drift.

### Why XState Actor Model?
Separating concerns (session, WebSocket, sketch) into independent actors with typed event communication prevents state entanglement. Each actor can be tested in isolation and reasoned about independently.

### Why Command Pattern for Undo/Redo?
Storing full state snapshots is memory-intensive. Commands store only deltas needed to reverse actions. Debouncing rapid changes (e.g., drag operations) keeps command history manageable.

### Why Durable Objects Over KV/D1?
DOs provide serialized access (no race conditions) and WebSocket Hibernation API for cost-effective real-time collaboration. Built-in SQLite storage handles room state persistence without external database.

## Getting Help

### Common Issues

**Issue: Audio context suspended**
- **Cause**: Browsers require user interaction before starting audio
- **Solution**: Call `Tone.start()` on first user click/touch event

**Issue: Visual timing drifts from audio**
- **Cause**: Using `setTimeout` or `setInterval` instead of `Tone.Draw`
- **Solution**: Always schedule visuals via `Tone.Draw.schedule(callback, audioTime)`

**Issue: WebSocket messages out of order**
- **Cause**: Network reordering or multiple connection attempts
- **Solution**: Use server sequence numbers, buffer out-of-order messages

**Issue: Undo/redo breaks on reconnection**
- **Cause**: Command history not synced from server
- **Solution**: Server maintains command log per session, sends on reconnect

**Issue: High memory usage during long sessions**
- **Cause**: Unbounded command history or audio buffer accumulation
- **Solution**: Checkpoint every 30s, clear history before checkpoint, dispose old buffers

### Resources
- [Figma's Multiplayer Architecture](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Tone.js Documentation](https://tonejs.github.io/)
- [P5.js Reference](https://p5js.org/reference/)
- [XState Documentation](https://stately.ai/docs)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Hono.js Guide](https://hono.dev/)

---

**Last Updated**: December 6, 2025
**Version**: 0.1.0 (Initial Specification)
