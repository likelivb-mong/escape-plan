import { useRef, useCallback, useMemo } from 'react';
import type { ThemeStep } from '../types/passmap';
import type { ThemeRoom } from '../types/passmap';
import StepPin from './StepPin';

// Room border colors (cycle through for visual distinction)
const ROOM_COLORS = [
  'rgba(168,130,85,0.5)',   // warm brown
  'rgba(130,168,85,0.4)',   // olive
  'rgba(85,130,168,0.4)',   // steel blue
  'rgba(168,85,130,0.4)',   // rose
  'rgba(130,85,168,0.4)',   // purple
  'rgba(168,155,85,0.4)',   // gold
];

const ROOM_NAME_COLORS = [
  '#c8a060',
  '#90b850',
  '#60a0c8',
  '#c86090',
  '#9060c8',
  '#c8b060',
];

interface MiniMapCanvasProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
  mapImage?: string;
  rooms?: ThemeRoom[];
  editable?: boolean;
  onStepMove?: (stepId: string, x: number, y: number) => void;
}

export default function MiniMapCanvas({
  steps,
  selectedStepId,
  onSelectStep,
  mapImage,
  rooms,
  editable = false,
  onStepMove,
}: MiniMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ stepId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Group steps by zone for step count per room
  const stepCountByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of steps) {
      map.set(s.zone, (map.get(s.zone) || 0) + 1);
    }
    return map;
  }, [steps]);

  const hasRooms = rooms && rooms.length > 0;

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
      const rect = containerRef.current.getBoundingClientRect();
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      // Convert pixel delta to percentage delta
      const dpx = (dx / rect.width) * 100;
      const dpy = (dy / rect.height) * 100;
      const newX = Math.max(0, Math.min(100, dragRef.current.origX + dpx));
      const newY = Math.max(0, Math.min(100, dragRef.current.origY + dpy));
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
      className="relative w-full h-full min-h-[400px] rounded-xl border border-white/10 bg-[#0a0b0e] overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: mapImage
            ? `url(${mapImage})`
            : `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
          backgroundSize: mapImage ? 'cover' : '5% 5%',
          backgroundPosition: 'center',
        }}
      />

      {/* Room rectangles */}
      {hasRooms && rooms.map((room, i) => {
        const borderColor = ROOM_COLORS[i % ROOM_COLORS.length];
        const nameColor = ROOM_NAME_COLORS[i % ROOM_NAME_COLORS.length];
        const count = stepCountByZone.get(room.name) || room.stepCount;

        return (
          <div
            key={room.name}
            className="absolute rounded-lg border"
            style={{
              left: `${room.x}%`,
              top: `${room.y}%`,
              width: `${room.width}%`,
              height: `${room.height}%`,
              borderColor,
              backgroundColor: `${borderColor.replace(/[\d.]+\)$/, '0.06)')}`,
            }}
          >
            {/* Room header */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span
                className="text-xs font-bold tracking-wide"
                style={{ color: nameColor }}
              >
                {room.name}
              </span>
              <span className="text-[10px] text-white/25 font-medium">
                {count}스텝
              </span>
            </div>
          </div>
        );
      })}

      {/* Label when no rooms */}
      {!hasRooms && (
        <div className="absolute top-4 left-4 text-xs text-white/10 font-mono">MAP VIEW</div>
      )}

      {/* Step pins — percentage-based when rooms exist */}
      {steps.map((step) => (
        <StepPin
          key={step.id}
          step={step}
          isSelected={step.id === selectedStepId}
          onClick={onSelectStep}
          draggable={editable}
          onDragStart={editable ? handleDragStart : undefined}
          usePercentage={hasRooms}
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
