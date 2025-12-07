/**
 * Audio Engine - High-level API for audio playback and loop management
 */

import { transportManager } from './TransportManager';
import { synthManager } from './SynthManager';
import type { LoopData, ScheduledAudioEvent } from '@workspace/shared-types';

export class AudioEngine {
  private static instance: AudioEngine;
  private scheduledEvents: Map<string, number[]> = new Map(); // loopId -> eventIds
  private isPlaying = false;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize audio engine (must be called after user interaction)
   */
  async init(): Promise<void> {
    await transportManager.init();
  }

  /**
   * Add a loop and schedule its audio events
   */
  addLoop(loop: LoopData): void {
    // Get or create synth for this loop
    synthManager.getSynth(loop.id, loop.parameters);

    // Schedule all audio events
    this.scheduleLoopEvents(loop);
  }

  /**
   * Update loop parameters or events
   */
  updateLoop(loop: LoopData): void {
    // Clear existing scheduled events
    this.clearLoopEvents(loop.id);

    // Update synth parameters
    synthManager.getSynth(loop.id, loop.parameters);

    // Re-schedule events
    this.scheduleLoopEvents(loop);
  }

  /**
   * Remove a loop
   */
  removeLoop(loopId: string): void {
    this.clearLoopEvents(loopId);
    synthManager.disposeSynth(loopId);
  }

  /**
   * Schedule all events for a loop
   */
  private scheduleLoopEvents(loop: LoopData): void {
    const eventIds: number[] = [];

    for (const event of loop.audioEvents) {
      if (!event.note || !event.duration) continue;

      // Calculate absolute time: loop start + event time
      const startPosition = `${loop.startBar}:0:0`;
      const absoluteTime = this.addPositions(startPosition, event.time);

      // Schedule the event
      const eventId = transportManager.scheduleRepeat((time) => {
        synthManager.triggerNote(
          loop.id,
          event.note!,
          event.duration!,
          time,
          event.velocity || 1
        );
      }, absoluteTime);

      eventIds.push(eventId);
    }

    this.scheduledEvents.set(loop.id, eventIds);
  }

  /**
   * Clear all scheduled events for a loop
   */
  private clearLoopEvents(loopId: string): void {
    const eventIds = this.scheduledEvents.get(loopId);
    if (eventIds) {
      for (const id of eventIds) {
        transportManager.cancel(id);
      }
      this.scheduledEvents.delete(loopId);
    }
  }

  /**
   * Add two transport positions (helper method)
   */
  private addPositions(pos1: string, pos2: string): string {
    const sec1 = transportManager.positionToSeconds(pos1);
    const sec2 = transportManager.positionToSeconds(pos2);
    return transportManager.secondsToPosition(sec1 + sec2);
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.isPlaying) {
      transportManager.start();
      this.isPlaying = true;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.isPlaying) {
      transportManager.stop();
      this.isPlaying = false;

      // Release all notes
      for (const [loopId] of this.scheduledEvents) {
        synthManager.releaseAll(loopId);
      }
    }
  }

  /**
   * Set BPM for all loops
   */
  setBPM(bpm: number): void {
    transportManager.setBPM(bpm);
  }

  /**
   * Set loop length in bars
   */
  setLoopLength(bars: number): void {
    transportManager.setLoopLength(bars);
  }

  /**
   * Get current transport state
   */
  getTransportState(): ReturnType<typeof transportManager.getState> {
    return transportManager.getState();
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stop();
    synthManager.disposeAll();
    transportManager.dispose();
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();
