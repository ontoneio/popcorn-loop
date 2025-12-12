/**
 * P5 Sketch Manager - Manages P5.js sketches synced to audio timeline
 */

import p5 from 'p5';
import type { VisualData } from '@workspace/shared/types';

export type SketchInstance = p5;

export interface SketchConfig {
  canvas: HTMLElement;
  width: number;
  height: number;
}

export class P5SketchManager {
  private sketches: Map<string, SketchInstance> = new Map();
  private currentFrame = 0;
  private audioAmplitude = 0;

  /**
   * Create a new sketch for a visual
   */
  createSketch(visualId: string, visualData: VisualData, config: SketchConfig): SketchInstance {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(config.width, config.height);
        this.setupSketchType(p, visualData);
      };

      p.draw = () => {
        this.drawSketchType(p, visualData);
      };
    };

    const instance = new p5(sketch, config.canvas);
    this.sketches.set(visualId, instance);
    return instance;
  }

  /**
   * Setup sketch based on type
   */
  private setupSketchType(p: p5, visualData: VisualData): void {
    p.background(0);
    
    switch (visualData.sketchType) {
      case 'particles':
        this.setupParticles(p, visualData);
        break;
      case 'waves':
        this.setupWaves(p, visualData);
        break;
      case 'geometry':
        this.setupGeometry(p, visualData);
        break;
      case 'lines':
        this.setupLines(p, visualData);
        break;
      case 'noise':
        this.setupNoise(p, visualData);
        break;
    }
  }

  /**
   * Draw sketch based on type
   */
  private drawSketchType(p: p5, visualData: VisualData): void {
    const { parameters } = visualData;
    const reactivity = parameters.reactivity;
    const speed = parameters.speed;

    // Apply audio reactivity
    const audioFactor = 1 + (this.audioAmplitude * reactivity);

    switch (visualData.sketchType) {
      case 'particles':
        this.drawParticles(p, visualData, audioFactor, speed);
        break;
      case 'waves':
        this.drawWaves(p, visualData, audioFactor, speed);
        break;
      case 'geometry':
        this.drawGeometry(p, visualData, audioFactor, speed);
        break;
      case 'lines':
        this.drawLines(p, visualData, audioFactor, speed);
        break;
      case 'noise':
        this.drawNoise(p, visualData, audioFactor, speed);
        break;
    }

    this.currentFrame++;
  }

  // ============================================================================
  // Particle Sketch
  // ============================================================================

  private setupParticles(p: p5, visualData: VisualData): void {
    p.colorMode(p.RGB);
  }

  private drawParticles(p: p5, visualData: VisualData, audioFactor: number, speed: number): void {
    p.background(0, 20); // Fade trail
    
    const { colorPalette, complexity } = visualData.parameters;
    const particleCount = Math.floor(10 + complexity * 40);

    for (let i = 0; i < particleCount; i++) {
      const angle = (this.currentFrame * speed * 0.01 + i) * audioFactor;
      const radius = 50 + Math.sin(angle * 0.5) * 100 * audioFactor;
      
      const x = p.width / 2 + Math.cos(angle) * radius;
      const y = p.height / 2 + Math.sin(angle) * radius;
      
      const color = colorPalette[i % colorPalette.length];
      p.fill(color);
      p.noStroke();
      p.circle(x, y, 5 + audioFactor * 5);
    }
  }

  // ============================================================================
  // Waves Sketch
  // ============================================================================

  private setupWaves(p: p5, visualData: VisualData): void {
    p.colorMode(p.RGB);
  }

  private drawWaves(p: p5, visualData: VisualData, audioFactor: number, speed: number): void {
    p.background(0, 30);
    
    const { colorPalette, complexity } = visualData.parameters;
    const waveCount = Math.floor(2 + complexity * 8);

    p.noFill();
    p.strokeWeight(2);

    for (let w = 0; w < waveCount; w++) {
      p.beginShape();
      const color = colorPalette[w % colorPalette.length];
      p.stroke(color);

      for (let x = 0; x < p.width; x += 5) {
        const y = p.height / 2 +
          Math.sin((x * 0.01 + this.currentFrame * speed * 0.02 + w * 0.5)) * 50 * audioFactor;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }

  // ============================================================================
  // Geometry Sketch
  // ============================================================================

  private setupGeometry(p: p5, visualData: VisualData): void {
    p.colorMode(p.RGB);
  }

  private drawGeometry(p: p5, visualData: VisualData, audioFactor: number, speed: number): void {
    p.background(0, 40);
    p.translate(p.width / 2, p.height / 2);
    
    const { colorPalette, complexity } = visualData.parameters;
    const shapeCount = Math.floor(3 + complexity * 12);

    for (let i = 0; i < shapeCount; i++) {
      p.push();
      p.rotate((this.currentFrame * speed * 0.01 + i * 0.5) * audioFactor);
      
      const size = 50 + i * 10 + audioFactor * 20;
      const color = colorPalette[i % colorPalette.length];
      
      p.stroke(color);
      p.noFill();
      p.strokeWeight(2);
      
      if (i % 2 === 0) {
        p.rect(0, 0, size, size);
      } else {
        p.circle(0, 0, size);
      }
      
      p.pop();
    }
  }

  // ============================================================================
  // Lines Sketch
  // ============================================================================

  private setupLines(p: p5, visualData: VisualData): void {
    p.colorMode(p.RGB);
  }

  private drawLines(p: p5, visualData: VisualData, audioFactor: number, speed: number): void {
    p.background(0, 50);
    
    const { colorPalette, complexity } = visualData.parameters;
    const lineCount = Math.floor(5 + complexity * 20);

    p.strokeWeight(2);

    for (let i = 0; i < lineCount; i++) {
      const angle = (this.currentFrame * speed * 0.01 + i) * audioFactor;
      const x1 = p.width / 2;
      const y1 = p.height / 2;
      const length = 100 + Math.sin(angle) * 50 * audioFactor;
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      
      const color = colorPalette[i % colorPalette.length];
      p.stroke(color);
      p.line(x1, y1, x2, y2);
    }
  }

  // ============================================================================
  // Noise Sketch
  // ============================================================================

  private setupNoise(p: p5, visualData: VisualData): void {
    p.colorMode(p.RGB);
    p.noiseDetail(4, 0.5);
  }

  private drawNoise(p: p5, visualData: VisualData, audioFactor: number, speed: number): void {
    p.background(0, 60);
    
    const { colorPalette, complexity } = visualData.parameters;
    const gridSize = Math.floor(20 - complexity * 15);

    p.noStroke();

    for (let x = 0; x < p.width; x += gridSize) {
      for (let y = 0; y < p.height; y += gridSize) {
        const noiseVal = p.noise(
          x * 0.01,
          y * 0.01,
          this.currentFrame * speed * 0.01 * audioFactor
        );
        
        const colorIndex = Math.floor(noiseVal * colorPalette.length);
        const color = colorPalette[colorIndex];
        
        p.fill(color);
        const size = gridSize * noiseVal * audioFactor;
        p.rect(x, y, size, size);
      }
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Update frame counter (called from transport sync)
   */
  updateFrame(frame: number): void {
    this.currentFrame = frame;
  }

  /**
   * Update audio amplitude for reactivity
   */
  updateAudioAmplitude(amplitude: number): void {
    this.audioAmplitude = amplitude;
  }

  /**
   * Update visual parameters
   */
  updateVisual(visualId: string, visualData: VisualData): void {
    // In a full implementation, would update the sketch's parameters
    // For now, requires recreating the sketch
  }

  /**
   * Remove and dispose a sketch
   */
  removeSketch(visualId: string): void {
    const sketch = this.sketches.get(visualId);
    if (sketch) {
      sketch.remove();
      this.sketches.delete(visualId);
    }
  }

  /**
   * Dispose all sketches
   */
  disposeAll(): void {
    for (const sketch of this.sketches.values()) {
      sketch.remove();
    }
    this.sketches.clear();
  }
}

// Export singleton instance
export const p5SketchManager = new P5SketchManager();
