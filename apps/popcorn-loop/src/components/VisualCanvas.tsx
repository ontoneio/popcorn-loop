/**
 * Visual Canvas Component (Solid.js)
 * Renders P5.js sketches synchronized to audio timeline
 */

import { onMount, onCleanup, createSignal } from 'solid-js';
import { p5SketchManager } from '../lib/visual';
import type { VisualData } from '@workspace/shared-types';

interface VisualCanvasProps {
  visualData: VisualData;
  width?: number;
  height?: number;
}

export default function VisualCanvas(props: VisualCanvasProps) {
  const [canvasRef, setCanvasRef] = createSignal<HTMLDivElement>();
  const width = props.width || 800;
  const height = props.height || 600;

  onMount(() => {
    const canvas = canvasRef();
    if (!canvas) return;

    // Create P5 sketch
    p5SketchManager.createSketch(props.visualData.id, props.visualData, {
      canvas,
      width,
      height,
    });

    // Listen for transport updates
    const handleTransportUpdate = (event: CustomEvent) => {
      // Frame updates are handled internally by P5SketchManager
    };

    window.addEventListener('transport:update', handleTransportUpdate as EventListener);

    onCleanup(() => {
      window.removeEventListener('transport:update', handleTransportUpdate as EventListener);
      p5SketchManager.removeSketch(props.visualData.id);
    });
  });

  return (
    <div
      ref={setCanvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: '1px solid #333',
        'background-color': '#000',
      }}
    />
  );
}
