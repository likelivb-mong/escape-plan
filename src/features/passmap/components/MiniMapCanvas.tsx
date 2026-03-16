import { useRef, useCallback, useMemo, useState } from 'react';
import type { ThemeStep } from '../types/passmap';
import type { ThemeRoom } from '../types/passmap';
import StepPin from './StepPin';

// Grid snap configuration
const GRID_SIZE = 5; // 5% grid

// Snap value to nearest grid cell
const snapToGrid = (value: number, gridSize: number = GRID_SIZE) => {
  return Math.round(value / gridSize) * gridSize;
};

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
  const roomDragRef = useRef<{ roomName: string; startX: number; startY: number; origX: number; origY: number; origWidth: number; origHeight: number; dragType: 'move' | 'resize' } | null>(null);
  const finalDragPositionRef = useRef<{ name: string; x: number; y: number; width: number; height: number } | null>(null);

  // State for dragging room display (enables visual feedback during drag)
  const [draggedRoom, setDraggedRoom] = useState<{ name: string; x: number; y: number; width: number; height: number } | null>(null);

  // Group steps by zone for step count per room
  const stepCountByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of steps) {
      map.set(s.zone, (map.get(s.zone) || 0) + 1);
    }
    return map;
  }, [steps]);

  const hasRooms = rooms && rooms.length > 0;

  // Check if a room collides with any other room
  const checkRoomCollision = useCallback((testRoom: { x: number; y: number; width: number; height: number }, excludeRoomName?: string) => {
    if (!rooms) return false;
    return rooms.some(other => {
      if (other.name === excludeRoomName) return false;
      // AABB collision detection
      return testRoom.x < other.x + other.width &&
             testRoom.x + testRoom.width > other.x &&
             testRoom.y < other.y + other.height &&
             testRoom.y + testRoom.height > other.y;
    });
  }, [rooms]);

  // Adjust position to avoid collision with minimum margin
  const getCollisionAdjustedPosition = useCallback((
    testRoom: { x: number; y: number; width: number; height: number },
    excludeRoomName?: string
  ) => {
    const margin = 0.5; // Minimum gap between rooms
    if (!rooms || !checkRoomCollision(testRoom, excludeRoomName)) {
      return testRoom; // No collision, return as-is
    }

    // Try to adjust by moving in cardinal directions
    const attempts = [
      { x: testRoom.x, y: testRoom.y - (testRoom.height + margin) }, // up
      { x: testRoom.x, y: testRoom.y + (testRoom.height + margin) }, // down
      { x: testRoom.x - (testRoom.width + margin), y: testRoom.y }, // left
      { x: testRoom.x + (testRoom.width + margin), y: testRoom.y }, // right
    ];

    for (const attempt of attempts) {
      const adjusted = { ...testRoom, x: attempt.x, y: attempt.y };
      if (!checkRoomCollision(adjusted, excludeRoomName)) {
        return adjusted;
      }
    }

    return testRoom; // Return original if no adjustment possible
  }, [rooms, checkRoomCollision]);

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

    // Find room boundaries for this step
    const room = rooms?.find(r => r.name === step.zone);

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      // Always convert to percentage delta
      const dpx = (dx / rect.width) * 100;
      const dpy = (dy / rect.height) * 100;

      let newX = dragRef.current.origX + dpx;
      let newY = dragRef.current.origY + dpy;

      // Snap to grid for stable alignment
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      // Constrain to room boundaries if room exists
      if (room) {
        const stepSize = 2.5; // Approximate step pin size
        const minX = room.x + stepSize;
        const maxX = room.x + room.width - stepSize;
        const minY = room.y + stepSize;
        const maxY = room.y + room.height - stepSize;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      } else {
        // Fallback to canvas boundaries if no room
        newX = Math.max(2, Math.min(98, newX));
        newY = Math.max(2, Math.min(98, newY));
      }

      // Snap again after boundary constraints
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      onStepMove?.(dragRef.current.stepId, newX, newY);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editable, onStepMove, rooms]);

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

      // Update state for visual feedback
      if (roomDragRef.current.dragType === 'move') {
        let newX = Math.max(0, Math.min(100 - roomDragRef.current.origWidth, roomDragRef.current.origX + dpx));
        let newY = Math.max(0, Math.min(100 - roomDragRef.current.origHeight, roomDragRef.current.origY + dpy));

        // Snap to grid for stable alignment
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);

        // Check and adjust for collision with other rooms
        const testRoom = {
          x: newX,
          y: newY,
          width: roomDragRef.current.origWidth,
          height: roomDragRef.current.origHeight,
        };
        const adjustedRoom = getCollisionAdjustedPosition(testRoom, roomDragRef.current.roomName);
        const finalX = snapToGrid(adjustedRoom.x);
        const finalY = snapToGrid(adjustedRoom.y);

        const draggedData = {
          name: roomDragRef.current.roomName,
          x: finalX,
          y: finalY,
          width: roomDragRef.current.origWidth,
          height: roomDragRef.current.origHeight,
        };
        setDraggedRoom(draggedData);
        finalDragPositionRef.current = draggedData;
      } else {
        let newWidth = Math.max(8, Math.min(100 - roomDragRef.current.origX, roomDragRef.current.origWidth + dpx));
        let newHeight = Math.max(8, Math.min(100 - roomDragRef.current.origY, roomDragRef.current.origHeight + dpy));

        // Snap to grid for stable alignment
        newWidth = snapToGrid(newWidth);
        newHeight = snapToGrid(newHeight);

        // Check and adjust for collision with other rooms
        const testRoom = {
          x: roomDragRef.current.origX,
          y: roomDragRef.current.origY,
          width: newWidth,
          height: newHeight,
        };
        const adjustedRoom = getCollisionAdjustedPosition(testRoom, roomDragRef.current.roomName);
        const finalWidth = snapToGrid(adjustedRoom.width);
        const finalHeight = snapToGrid(adjustedRoom.height);

        const draggedData = {
          name: roomDragRef.current.roomName,
          x: roomDragRef.current.origX,
          y: roomDragRef.current.origY,
          width: finalWidth,
          height: newHeight,
        };
        setDraggedRoom(draggedData);
        finalDragPositionRef.current = draggedData;
      }
    };

    const handleMouseUp = () => {
      if (roomDragRef.current && finalDragPositionRef.current) {
        // Call callbacks only once when drag ends using final position from ref
        if (roomDragRef.current.dragType === 'move') {
          onRoomMove?.(
            roomDragRef.current.roomName,
            finalDragPositionRef.current.x - roomDragRef.current.origX,
            finalDragPositionRef.current.y - roomDragRef.current.origY
          );
        } else {
          onRoomUpdate?.(roomDragRef.current.roomName, {
            width: finalDragPositionRef.current.width,
            height: finalDragPositionRef.current.height,
          });
        }
      }
      roomDragRef.current = null;
      finalDragPositionRef.current = null;
      setDraggedRoom(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editable, onRoomUpdate, onRoomMove, getCollisionAdjustedPosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-xl border border-white/10 bg-[#0a0b0e] overflow-hidden"
    >
      {/* Grid background - snap-to-grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: mapImage
            ? `url(${mapImage})`
            : `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
          backgroundSize: mapImage ? 'cover' : `${GRID_SIZE}% ${GRID_SIZE}%`,
          backgroundPosition: 'center',
        }}
      />

      {/* Room rectangles */}
      {hasRooms && rooms.map((room, i) => {
        const borderColor = ROOM_COLORS[i % ROOM_COLORS.length];
        const nameColor = ROOM_NAME_COLORS[i % ROOM_NAME_COLORS.length];
        const count = stepCountByZone.get(room.name) || room.stepCount;

        // Use dragged state during drag, otherwise use room values
        const isDragging = draggedRoom?.name === room.name;
        const displayX = isDragging ? draggedRoom.x : room.x;
        const displayY = isDragging ? draggedRoom.y : room.y;
        const displayWidth = isDragging ? draggedRoom.width : room.width;
        const displayHeight = isDragging ? draggedRoom.height : room.height;

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
