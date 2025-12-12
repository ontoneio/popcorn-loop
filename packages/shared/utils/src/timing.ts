/**
 * Timing utilities for converting between Tone.js transport positions,
 * milliseconds, and frame numbers
 */

/**
 * Parse Tone.js transport position string "bar:beat:sixteenth" to components
 */
export function parseTransportPosition(position: string): {
  bars: number;
  beats: number;
  sixteenths: number;
} {
  const parts = position.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid transport position format: ${position}`);
  }
  return {
    bars: parts[0],
    beats: parts[1],
    sixteenths: parts[2],
  };
}

/**
 * Convert transport position to total sixteenth notes
 */
export function positionToSixteenths(
  position: string,
  beatsPerBar: number = 4
): number {
  const { bars, beats, sixteenths } = parseTransportPosition(position);
  return bars * beatsPerBar * 4 + beats * 4 + sixteenths;
}

/**
 * Convert sixteenth notes to transport position string
 */
export function sixteenthsToPosition(
  sixteenths: number,
  beatsPerBar: number = 4
): string {
  const sixteenthsPerBar = beatsPerBar * 4;
  const bars = Math.floor(sixteenths / sixteenthsPerBar);
  const remainder = sixteenths % sixteenthsPerBar;
  const beats = Math.floor(remainder / 4);
  const sixteenthsRemainder = remainder % 4;
  
  return `${bars}:${beats}:${sixteenthsRemainder}`;
}

/**
 * Convert transport position to milliseconds
 */
export function positionToMs(
  position: string,
  bpm: number,
  beatsPerBar: number = 4
): number {
  const totalSixteenths = positionToSixteenths(position, beatsPerBar);
  const secondsPerBeat = 60 / bpm;
  const secondsPerSixteenth = secondsPerBeat / 4;
  return totalSixteenths * secondsPerSixteenth * 1000;
}

/**
 * Convert milliseconds to transport position
 */
export function msToPosition(
  ms: number,
  bpm: number,
  beatsPerBar: number = 4
): string {
  const secondsPerBeat = 60 / bpm;
  const secondsPerSixteenth = secondsPerBeat / 4;
  const totalSixteenths = Math.floor(ms / 1000 / secondsPerSixteenth);
  return sixteenthsToPosition(totalSixteenths, beatsPerBar);
}

/**
 * Convert transport position to frame number at given FPS
 */
export function positionToFrame(
  position: string,
  bpm: number,
  fps: number = 60,
  beatsPerBar: number = 4
): number {
  const ms = positionToMs(position, bpm, beatsPerBar);
  return Math.floor((ms / 1000) * fps);
}

/**
 * Convert frame number to transport position
 */
export function frameToPosition(
  frame: number,
  bpm: number,
  fps: number = 60,
  beatsPerBar: number = 4
): string {
  const ms = (frame / fps) * 1000;
  return msToPosition(ms, bpm, beatsPerBar);
}

/**
 * Add two transport positions
 */
export function addPositions(
  pos1: string,
  pos2: string,
  beatsPerBar: number = 4
): string {
  const sixteenths1 = positionToSixteenths(pos1, beatsPerBar);
  const sixteenths2 = positionToSixteenths(pos2, beatsPerBar);
  return sixteenthsToPosition(sixteenths1 + sixteenths2, beatsPerBar);
}

/**
 * Subtract two transport positions (pos1 - pos2)
 */
export function subtractPositions(
  pos1: string,
  pos2: string,
  beatsPerBar: number = 4
): string {
  const sixteenths1 = positionToSixteenths(pos1, beatsPerBar);
  const sixteenths2 = positionToSixteenths(pos2, beatsPerBar);
  const result = Math.max(0, sixteenths1 - sixteenths2);
  return sixteenthsToPosition(result, beatsPerBar);
}

/**
 * Compare two transport positions
 * Returns: -1 if pos1 < pos2, 0 if equal, 1 if pos1 > pos2
 */
export function comparePositions(
  pos1: string,
  pos2: string,
  beatsPerBar: number = 4
): number {
  const sixteenths1 = positionToSixteenths(pos1, beatsPerBar);
  const sixteenths2 = positionToSixteenths(pos2, beatsPerBar);
  
  if (sixteenths1 < sixteenths2) return -1;
  if (sixteenths1 > sixteenths2) return 1;
  return 0;
}

/**
 * Quantize transport position to nearest subdivision
 */
export function quantizePosition(
  position: string,
  subdivision: '1n' | '2n' | '4n' | '8n' | '16n' = '16n',
  beatsPerBar: number = 4
): string {
  const sixteenths = positionToSixteenths(position, beatsPerBar);
  
  const subdivisionToSixteenths: Record<string, number> = {
    '1n': 16,
    '2n': 8,
    '4n': 4,
    '8n': 2,
    '16n': 1,
  };
  
  const step = subdivisionToSixteenths[subdivision];
  const quantized = Math.round(sixteenths / step) * step;
  
  return sixteenthsToPosition(quantized, beatsPerBar);
}

/**
 * Get loop duration in milliseconds
 */
export function getLoopDurationMs(lengthBars: number, bpm: number, beatsPerBar: number = 4): number {
  const beatsPerLoop = lengthBars * beatsPerBar;
  const secondsPerBeat = 60 / bpm;
  return beatsPerLoop * secondsPerBeat * 1000;
}

/**
 * Calculate bars from milliseconds
 */
export function msToBars(ms: number, bpm: number, beatsPerBar: number = 4): number {
  const secondsPerBeat = 60 / bpm;
  const beatsPerBar_ = beatsPerBar;
  const secondsPerBar = secondsPerBeat * beatsPerBar_;
  return ms / 1000 / secondsPerBar;
}
