import { useRef, useCallback } from 'react';
import type { ThemeStep } from '../types/passmap';
import StepPin from './StepPin';

interface MiniMapCanvasProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
  mapImage?: string;
  editable?: boolean;
  onStepMove?: (stepId: string, x: number, y: number) => void;
}

export default function MiniMapCanvas({
  steps,
  selectedStepId,
  onSelectStep,
  mapImage,
  editable = false,
  onStepMove,
}: MiniMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ stepId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent, step: ThemeStep) => {
    if (!editable) return;
    e.preventDefault();
    dragRef.current = {
      stepId: step.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: step.x,
      origY: step.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      const newX = Math.max(0, dragRef.current.origX + dx);
      const newY = Math.max(0, dragRef.current.origY + dy);
      onStepMove?.(dragRef.current.stepId, newX, newY);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editable, onStepMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: mapImage
            ? `url(${mapImage})`
            : `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
          backgroundSize: mapImage ? 'cover' : '40px 40px',
          backgroundPosition: 'center',
        }}
      />

      {/* Room zone labels (decorative for mock) */}
      <div className="absolute top-4 left-4 text-xs text-white/10 font-mono">MAP VIEW</div>

      {/* Step pins */}
      {steps.map((step) => (
        <StepPin
          key={step.id}
          step={step}
          isSelected={step.id === selectedStepId}
          onClick={onSelectStep}
          draggable={editable}
          onDragStart={editable ? handleDragStart : undefined}
        />
      ))}

      {/* Empty state */}
      {steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
          No steps to display
        </div>
      )}
    </div>
  );
}
