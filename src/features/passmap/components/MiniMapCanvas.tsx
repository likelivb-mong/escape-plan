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
  onRoomUpdate?: (roomName: string, updates: Partial<ThemeRoom>) => void;
  onRoomMove?: (roomName: string, deltaX: number, deltaY: number) => void;
}

export default function MiniMapCanvas({
  steps,
  selectedStepId,
  onSelectStep,
  mapImage,
  rooms,
  editable = false,
  onStepMove,
  onRoomUpdate,
  onRoomMove,
}: MiniMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ stepId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const roomDragRef = useRef<{ roomName: string; startX: number; startY: number; origX: number; origY: number; origWidth: number; origHeight: number; dragType: 'move' | 'resize'; pendingX?: number; pendingY?: number; pendingWidth?: number; pendingHeight?: number } | null>(null);

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
      // Always convert to percentage delta
      const dpx = (dx / rect.width) * 100;
      const dpy = (dy / rect.height) * 100;
      const newX = Math.max(2, Math.min(98, dragRef.current.origX + dpx));
      const newY = Math.max(2, Math.min(98, dragRef.current.origY + dpy));
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

  const handleRoomDragStart = useCallback((e: React.MouseEvent, room: ThemeRoom, dragType: 'move' | 'resize') => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();

    roomDragRef.current = {
      roomName: room.name,
      startX: e.clientX,
      startY: e.clientY,
      origX: room.x,
      origY: room.y,
      origWidth: room.width,
      origHeight: room.height,
      dragType,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!roomDragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = me.clientX - roomDragRef.current.startX;
      const dy = me.clientY - roomDragRef.current.startY;
      const dpx = (dx / rect.width) * 100;
      const dpy = (dy / rect.height) * 100;

      // Store pending values but don't call callbacks (avoid excessive re-renders)
      if (roomDragRef.current.dragType === 'move') {
        const newX = Math.max(0, Math.min(100 - roomDragRef.current.origWidth, roomDragRef.current.origX + dpx));
        const newY = Math.max(0, Math.min(100 - roomDragRef.current.origHeight, roomDragRef.current.origY + dpy));
        roomDragRef.current.pendingX = newX;
        roomDragRef.current.pendingY = newY;
      } else {
        const newWidth = Math.max(8, Math.min(100 - roomDragRef.current.origX, roomDragRef.current.origWidth + dpx));
        const newHeight = Math.max(8, Math.min(100 - roomDragRef.current.origY, roomDragRef.current.origHeight + dpy));
        roomDragRef.current.pendingWidth = newWidth;
        roomDragRef.current.pendingHeight = newHeight;
      }
    };

    const handleMouseUp = () => {
      if (roomDragRef.current) {
        // Call callbacks only once when drag ends
        if (roomDragRef.current.dragType === 'move' && roomDragRef.current.pendingX !== undefined && roomDragRef.current.pendingY !== undefined) {
          onRoomMove?.(roomDragRef.current.roomName, roomDragRef.current.pendingX - roomDragRef.current.origX, roomDragRef.current.pendingY - roomDragRef.current.origY);
        } else if (roomDragRef.current.dragType === 'resize' && roomDragRef.current.pendingWidth !== undefined && roomDragRef.current.pendingHeight !== undefined) {
          onRoomUpdate?.(roomDragRef.current.roomName, { width: roomDragRef.current.pendingWidth, height: roomDragRef.current.pendingHeight });
        }
      }
      roomDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editable, onRoomUpdate, onRoomMove]);

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

        // Use pending values during drag, otherwise use room values
        const isDragging = roomDragRef.current?.roomName === room.name;
        const displayX = isDragging && roomDragRef.current?.pendingX !== undefined ? roomDragRef.current.pendingX : room.x;
        const displayY = isDragging && roomDragRef.current?.pendingY !== undefined ? roomDragRef.current.pendingY : room.y;
        const displayWidth = isDragging && roomDragRef.current?.pendingWidth !== undefined ? roomDragRef.current.pendingWidth : room.width;
        const displayHeight = isDragging && roomDragRef.current?.pendingHeight !== undefined ? roomDragRef.current.pendingHeight : room.height;

        return (
          <div
            key={room.name}
            className={`absolute rounded-lg transition-colors ${
              editable ? 'cursor-move' : ''
            }`}
            style={{
              left: `${displayX}%`,
              top: `${displayY}%`,
              width: `${displayWidth}%`,
              height: `${displayHeight}%`,
              border: `1px solid ${borderColor}`,
              backgroundColor: `${borderColor.replace(/[\d.]+\)$/, '0.06)')}`,
            }}
            onMouseDown={(e) => handleRoomDragStart(e, room, 'move')}
          >
            {/* Room header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 select-none pointer-events-none">
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

            {/* Resize handle (bottom-right corner) */}
            {editable && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
                style={{
                  background: borderColor,
                  borderRadius: '0 0 4px 0',
                }}
                onMouseDown={(e) => handleRoomDragStart(e, room, 'resize')}
                title="드래그로 크기 조정"
              />
            )}
          </div>
        );
      })}

      {/* Label when no rooms */}
      {!hasRooms && (
        <div className="absolute top-4 left-4 text-xs text-white/10 font-mono">MAP VIEW</div>
      )}

      {/* Step pins — always percentage-based (coordinates are normalized on load) */}
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
          Step이 없습니다
        </div>
      )}
    </div>
  );
}
