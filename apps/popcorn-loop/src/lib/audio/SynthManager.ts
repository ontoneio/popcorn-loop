/**
 * Audio Synth Manager - Creates and manages Tone.js synthesizers
 */

import * as Tone from 'tone';
import type { AudioParameters, SynthType } from '@workspace/shared-types';

export class SynthManager {
  private synths: Map<string, Tone.PolySynth> = new Map();

  /**
   * Create or get a synth for a loop
   */
  getSynth(loopId: string, params: AudioParameters): Tone.PolySynth {
    let synth = this.synths.get(loopId);

    if (!synth) {
      synth = this.createSynth(params);
      this.synths.set(loopId, synth);
    } else {
      this.updateSynthParameters(synth, params);
    }

    return synth;
  }

  /**
   * Create a new polyphonic synthesizer
   */
  private createSynth(params: AudioParameters): Tone.PolySynth {
    const oscillatorType = this.mapSynthType(params.synthType);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: oscillatorType,
      },
      envelope: params.envelope,
      volume: params.volume,
    });

    // Apply filter if specified
    if (params.filter) {
      const filter = new Tone.Filter({
        type: params.filter.type as BiquadFilterType,
        frequency: params.filter.frequency,
        Q: params.filter.q,
      });
      synth.connect(filter);
      filter.toDestination();
    } else {
      synth.toDestination();
    }

    // Apply panning
    const panner = new Tone.Panner(params.pan);
    synth.connect(panner);
    panner.toDestination();

    return synth;
  }

  /**
   * Update synth parameters
   */
  private updateSynthParameters(synth: Tone.PolySynth, params: AudioParameters): void {
    synth.set({
      envelope: params.envelope,
      volume: params.volume,
    });

    // Note: Oscillator type and filter changes require recreating the synth
    // This is a simplified implementation - full implementation would handle this
  }

  /**
   * Map custom synth types to Tone.js oscillator types
   */
  private mapSynthType(type: SynthType): Tone.ToneOscillatorType {
    const mapping: Record<SynthType, Tone.ToneOscillatorType> = {
      sine: 'sine',
      triangle: 'triangle',
      square: 'square',
      sawtooth: 'sawtooth',
      fm: 'sine', // FM would need FMSynth
      am: 'sine', // AM would need AMSynth
    };
    return mapping[type];
  }

  /**
   * Trigger a note on a specific synth
   */
  triggerNote(
    loopId: string,
    note: string,
    duration: string,
    time: number,
    velocity: number = 1
  ): void {
    const synth = this.synths.get(loopId);
    if (synth) {
      synth.triggerAttackRelease(note, duration, time, velocity);
    }
  }

  /**
   * Release (stop) all notes on a synth
   */
  releaseAll(loopId: string): void {
    const synth = this.synths.get(loopId);
    if (synth) {
      synth.releaseAll();
    }
  }

  /**
   * Remove and dispose a synth
   */
  disposeSynth(loopId: string): void {
    const synth = this.synths.get(loopId);
    if (synth) {
      synth.dispose();
      this.synths.delete(loopId);
    }
  }

  /**
   * Dispose all synths
   */
  disposeAll(): void {
    for (const synth of this.synths.values()) {
      synth.dispose();
    }
    this.synths.clear();
  }
}

// Export singleton instance
export const synthManager = new SynthManager();
