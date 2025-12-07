/**
 * Transport Manager - Master clock for audio/visual synchronization
 * Tone.js Transport serves as single source of timing truth
 */

import * as Tone from 'tone';
import type { TransportState } from '@workspace/shared-types';

export class TransportManager {
  private static instance: TransportManager;
  private isInitialized = false;
  private callbacks: Map<string, (time: number) => void> = new Map();

  private constructor() {
    this.setupTransport();
  }

  static getInstance(): TransportManager {
    if (!TransportManager.instance) {
      TransportManager.instance = new TransportManager();
    }
    return TransportManager.instance;
  }

  /**
   * Initialize audio context (requires user interaction)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    await Tone.start();
    console.log('Audio context started');
    this.isInitialized = true;
  }

  /**
   * Setup Transport with default settings
   */
  private setupTransport(): void {
    Tone.Transport.bpm.value = 120;
    Tone.Transport.timeSignature = [4, 4];
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = '4m'; // 4 bars
  }

  /**
   * Get current transport state
   */
  getState(): TransportState {
    return {
      position: Tone.Transport.position.toString(),
      isPlaying: Tone.Transport.state === 'started',
      bpm: Tone.Transport.bpm.value,
      loopLengthBars: this.getLoopLengthBars(),
      timeSignature: Tone.Transport.timeSignature as [number, number],
    };
  }

  /**
   * Set BPM (beats per minute)
   */
  setBPM(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Set loop length in bars
   */
  setLoopLength(bars: number): void {
    Tone.Transport.loopEnd = `${bars}m`;
  }

  /**
   * Get loop length in bars
   */
  private getLoopLengthBars(): number {
    const loopEnd = Tone.Transport.loopEnd;
    // Parse "4m" format
    const match = loopEnd.toString().match(/^(\d+)m$/);
    return match ? parseInt(match[1]) : 4;
  }

  /**
   * Start playback
   */
  start(): void {
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }
  }

  /**
   * Pause playback (maintains position)
   */
  pause(): void {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
    }
  }

  /**
   * Seek to specific position
   */
  seek(position: string): void {
    Tone.Transport.position = position;
  }

  /**
   * Schedule a callback at specific time
   * @param callback - Function to call at scheduled time
   * @param time - Tone.js time format (e.g., "1:0:0" for bar 1)
   * @returns Event ID for cancellation
   */
  scheduleOnce(callback: (time: number) => void, time: string): number {
    return Tone.Transport.schedule(callback, time);
  }

  /**
   * Schedule a repeating callback
   * @param callback - Function to call repeatedly
   * @param interval - Repeat interval (e.g., "16n" for every 16th note)
   * @returns Event ID for cancellation
   */
  scheduleRepeat(callback: (time: number) => void, interval: string): number {
    return Tone.Transport.scheduleRepeat(callback, interval);
  }

  /**
   * Cancel scheduled event
   */
  cancel(eventId: number): void {
    Tone.Transport.clear(eventId);
  }

  /**
   * Schedule visual update synchronized to audio time
   * Uses Tone.Draw to defer execution to animation frame
   */
  scheduleVisualUpdate(callback: () => void, audioTime: number): void {
    Tone.Draw.schedule(() => {
      callback();
    }, audioTime);
  }

  /**
   * Register a named callback for frame-by-frame updates
   */
  registerCallback(name: string, callback: (time: number) => void): void {
    this.callbacks.set(name, callback);
  }

  /**
   * Unregister a named callback
   */
  unregisterCallback(name: string): void {
    this.callbacks.delete(name);
  }

  /**
   * Setup main loop that calls all registered callbacks
   * Should be called once during initialization
   */
  setupMainLoop(interval: string = '16n'): number {
    return this.scheduleRepeat((time) => {
      // Call audio callbacks immediately
      for (const callback of this.callbacks.values()) {
        callback(time);
      }

      // Schedule visual updates for next animation frame
      this.scheduleVisualUpdate(() => {
        const position = Tone.Transport.position.toString();
        const event = new CustomEvent('transport:update', {
          detail: { position, time },
        });
        window.dispatchEvent(event);
      }, time);
    }, interval);
  }

  /**
   * Get current audio context time
   */
  now(): number {
    return Tone.now();
  }

  /**
   * Convert transport position to seconds
   */
  positionToSeconds(position: string): number {
    return Tone.Time(position).toSeconds();
  }

  /**
   * Convert seconds to transport position
   */
  secondsToPosition(seconds: number): string {
    return Tone.Time(seconds).toBarsBeatsSixteenths();
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    Tone.Transport.cancel();
    this.callbacks.clear();
  }
}

// Export singleton instance
export const transportManager = TransportManager.getInstance();
