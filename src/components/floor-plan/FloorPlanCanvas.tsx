import { useState, useRef, useCallback } from 'react';
import type { GameFlowPlan } from '../../types/gameFlow';
import type { FloorPlanData, DoorLayout, DoorType } from '../../types/floorPlan';
import FloorPlanRoom from './FloorPlanRoom';
import FloorPlanDoor from './FloorPlanDoor';
import { useTheme } from '../../context/ThemeContext';

interface FloorPlanCanvasProps {
  plan: GameFlowPlan;
  floorPlan: FloorPlanData;
  onUpdateFloorPlan: (data: FloorPlanData) => void;
  isEditing: boolean;
}

interface DragState {
  type: 'room' | 'door';
  id: string;
  mode: 'move' | 'resize';
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

function snap(value: number, grid: number = 5): number {
  return Math.round(value / grid) * grid;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function FloorPlanCanvas({
  plan,
  floorPlan,
  onUpdateFloorPlan,
  isEditing,
}: FloorPlanCanvasProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const doors = floorPlan.doors ?? [];

  // Group steps by room
  const stepsByRoom = new Map<string, typeof plan.steps>();
  for (const step of plan.steps) {
    const arr = stepsByRoom.get(step.room) ?? [];
    arr.push(step);
    stepsByRoom.set(step.room, arr);
  }

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? null;
  }, []);

  // ── Room handlers ────────────────────────────────────────────────────────────

  const handleRoomMoveStart = useCallback((roomName: string, e: React.PointerEvent) => {
    const room = floorPlan.rooms.find(r => r.roomName === roomName);
    if (!room) return;
    setDragState({
      type: 'room', id: roomName, mode: 'move',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: room.x, startY: room.y, startW: room.width, startH: room.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [floorPlan.rooms]);

  const handleRoomResizeStart = useCallback((roomName: string, e: React.PointerEvent) => {
    const room = floorPlan.rooms.find(r => r.roomName === roomName);
    if (!room) return;
    setDragState({
      type: 'room', id: roomName, mode: 'resize',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: room.x, startY: room.y, startW: room.width, startH: room.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [floorPlan.rooms]);

  // ── Door handlers ────────────────────────────────────────────────────────────

  const handleDoorMoveStart = useCallback((doorId: string, e: React.PointerEvent) => {
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    setDragState({
      type: 'door', id: doorId, mode: 'move',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: door.x, startY: door.y, startW: door.width, startH: door.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [doors]);

  const handleDoorResizeStart = useCallback((doorId: string, e: React.PointerEvent) => {
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    setDragState({
      type: 'door', id: doorId, mode: 'resize',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: door.x, startY: door.y, startW: door.width, startH: door.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [doors]);

  const handleDoorRotate = useCallback((doorId: string) => {
    onUpdateFloorPlan({
      ...floorPlan,
      doors: doors.map(d =>
        d.id === doorId ? { ...d, rotation: (d.rotation + 90) % 360 } : d
      ),
    });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleDoorDelete = useCallback((doorId: string) => {
    onUpdateFloorPlan({
      ...floorPlan,
      doors: doors.filter(d => d.id !== doorId),
    });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleDoorChangeType = useCallback((doorId: string, type: DoorType) => {
    onUpdateFloorPlan({
      ...floorPlan,
      doors: doors.map(d => d.id === doorId ? { ...d, type } : d),
    });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleAddDoor = useCallback(() => {
    const newDoor: DoorLayout = {
      id: `door-${Date.now()}`,
      x: 45,
      y: 45,
      width: 10,
      height: 10,
      rotation: 0,
      type: 'swing',
    };
    onUpdateFloorPlan({ ...floorPlan, doors: [...doors, newDoor] });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleUpdateStepPosition = useCallback((stepId: string, x: number, y: number) => {
    onUpdateFloorPlan({
      ...floorPlan,
      stepPositions: { ...(floorPlan.stepPositions ?? {}), [stepId]: { x, y } },
    });
  }, [floorPlan, onUpdateFloorPlan]);

  // ── Pointer move / up ────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;
    const rect = getContainerRect();
    if (!rect) return;

    const dx = ((e.clientX - dragState.startPointerX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startPointerY) / rect.height) * 100;

    if (dragState.type === 'room') {
      const updatedRooms = floorPlan.rooms.map(room => {
        if (room.roomName !== dragState.id) return room;
        if (dragState.mode === 'move') {
          return {
            ...room,
            x: snap(clamp(dragState.startX + dx, 0, 100 - room.width)),
            y: snap(clamp(dragState.startY + dy, 0, 100 - room.height)),
          };
        } else {
          return {
            ...room,
            width: snap(clamp(dragState.startW + dx, 10, 100 - room.x)),
            height: snap(clamp(dragState.startH + dy, 10, 100 - room.y)),
          };
        }
      });
      onUpdateFloorPlan({ ...floorPlan, doors, rooms: updatedRooms });
    } else {
      const updatedDoors = doors.map(door => {
        if (door.id !== dragState.id) return door;
        if (dragState.mode === 'move') {
          return {
            ...door,
            x: snap(clamp(dragState.startX + dx, 0, 100 - door.width)),
            y: snap(clamp(dragState.startY + dy, 0, 100 - door.height)),
          };
        } else {
          return {
            ...door,
            width:  snap(clamp(dragState.startW + dx, 5, 60)),
            height: snap(clamp(dragState.startH + dy, 5, 60)),
          };
        }
      });
      onUpdateFloorPlan({ ...floorPlan, doors: updatedDoors });
    }
  }, [dragState, floorPlan, doors, getContainerRect, onUpdateFloorPlan]);

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Canvas info */}
      <div className="flex items-center gap-3 px-1 flex-shrink-0">
        <span className="text-caption text-white/35">
          {floorPlan.rooms.length}개 공간 배치
        </span>
        {doors.length > 0 && (
          <span className="text-caption text-white/30">
            · 문 {doors.length}개
          </span>
        )}
        <span className="text-micro text-white/15">
          드래그로 이동 · 우하단 핸들로 크기 조절
        </span>
        {isEditing && (
          <button
            onClick={handleAddDoor}
            className="ml-auto px-2.5 py-1 rounded-full border border-white/[0.15] text-caption text-white/50 hover:text-white/75 hover:border-white/30 transition-all"
          >
            + 문 추가
          </button>
        )}
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={`relative flex-1 min-h-[400px] rounded-2xl border overflow-hidden transition-colors duration-200 ${
          isEditing
            ? 'border-white/[0.15] bg-white/[0.03]'
            : 'border-white/[0.07] bg-white/[0.01]'
        }`}
        style={{
          backgroundImage: [
            isEditing
              ? `linear-gradient(to right, ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px)`
              : `linear-gradient(to right, ${theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.025)'} 1px, transparent 1px)`,
            isEditing
              ? `linear-gradient(to bottom, ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px)`
              : `linear-gradient(to bottom, ${theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.025)'} 1px, transparent 1px)`,
          ].join(', '),
          backgroundSize: '5% 5%',
        }}
        onPointerMove={isEditing ? handlePointerMove : undefined}
        onPointerUp={isEditing ? handlePointerUp : undefined}
        onPointerCancel={isEditing ? handlePointerUp : undefined}
      >
        {floorPlan.rooms.map((layout, i) => (
          <FloorPlanRoom
            key={layout.roomName}
            layout={layout}
            steps={stepsByRoom.get(layout.roomName) ?? []}
            roomIndex={i}
            isEditing={isEditing}
            stepPositions={floorPlan.stepPositions ?? {}}
            onMoveStart={handleRoomMoveStart}
            onResizeStart={handleRoomResizeStart}
            onUpdateStepPosition={handleUpdateStepPosition}
          />
        ))}

        {doors.map(door => (
          <FloorPlanDoor
            key={door.id}
            door={door}
            isEditing={isEditing}
            onMoveStart={handleDoorMoveStart}
            onResizeStart={handleDoorResizeStart}
            onRotate={handleDoorRotate}
            onChangeType={handleDoorChangeType}
            onDelete={handleDoorDelete}
          />
        ))}
      </div>
    </div>
  );
}
