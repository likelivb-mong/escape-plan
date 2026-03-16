import { useRef, useCallback, useMemo } from 'react';
import type { ThemeStep } from '../types/passmap';
import type { ThemeRoom } from '../types/passmap';
import StepPin from './StepPin';

// Grid snap configuration
const GRID_SIZE = 5; // 5% grid

const snapToGrid = (value: number, gridSize: number = GRID_SIZE) => {
  return Math.round(value / gridSize) * gridSize;
};

// Room border colors (cycle through for visual distinction)
const ROOM_COLORS = [
  'rgba(168,130,85,0.5)',
  'rgba(130,168,85,0.4)',
  'rgba(85,130,168,0.4)',
  'rgba(168,85,130,0.4)',
  'rgba(130,85,168,0.4)',
  'rgba(168,155,85,0.4)',
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

// ── RoomBox: 독립 레이아웃 단위 ─────────────────────────────────────────────

interface RoomBoxProps {
  room: ThemeRoom;
  index: number;
  steps: ThemeStep[];
  selectedStepId: string | null;
  editable: boolean;
  onSelectStep: (step: ThemeStep) => void;
  onStepMove?: (stepId: string, x: number, y: number) => void;
}

function RoomBox({
  room,
  index,
  steps,
  selectedStepId,
  editable,
  onSelectStep,
  onStepMove,
}: RoomBoxProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const borderColor = ROOM_COLORS[index % ROOM_COLORS.length];
  const nameColor = ROOM_NAME_COLORS[index % ROOM_NAME_COLORS.length];

  // 스텝 핀 드래그: 룸 내부 좌표 기준으로 계산
  const handleStepDragStart = useCallback(
    (e: React.MouseEvent, step: ThemeStep) => {
      if (!editable || !onStepMove) return;
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = step.x;
      const origY = step.y;

      const handleMouseMove = (me: MouseEvent) => {
        if (!roomRef.current) return;
        const rect = roomRef.current.getBoundingClientRect();
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        const dpx = (dx / rect.width) * 100;
        const dpy = (dy / rect.height) * 100;

        const PIN_MARGIN = 5;
        const newX = snapToGrid(
          Math.max(PIN_MARGIN, Math.min(100 - PIN_MARGIN, origX + dpx)),
        );
        const newY = snapToGrid(
          Math.max(PIN_MARGIN, Math.min(100 - PIN_MARGIN, origY + dpy)),
        );

        onStepMove(step.id, newX, newY);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [editable, onStepMove],
  );

  return (
    <div
      ref={roomRef}
      className="relative flex-shrink-0 rounded-lg"
      style={{
        // 룸 크기는 기존 % 값 기반으로 px 환산 (최소 크기 보장)
        width: `${Math.max(room.width * 4, 200)}px`,
        minHeight: `${Math.max(room.height * 4, 150)}px`,
        border: `1px solid ${borderColor}`,
        backgroundColor: borderColor.replace(/[\d.]+\)$/, '0.06)'),
      }}
    >
      {/* Room header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 select-none">
        <span className="text-xs font-bold tracking-wide" style={{ color: nameColor }}>
          {room.name}
        </span>
        <span className="text-[10px] text-white/25 font-medium">
          {steps.length}스텝
        </span>
      </div>

      {/* Step pins — room-relative coordinates (0–100% within this box) */}
      {steps.map((step) => (
        <StepPin
          key={step.id}
          step={step}
          isSelected={step.id === selectedStepId}
          onClick={onSelectStep}
          draggable={editable}
          onDragStart={editable ? handleStepDragStart : undefined}
        />
      ))}
    </div>
  );
}

// ── MiniMapCanvas ─────────────────────────────────────────────────────────────

export default function MiniMapCanvas({
  steps,
  selectedStepId,
  onSelectStep,
  rooms,
  editable = false,
  onStepMove,
}: MiniMapCanvasProps) {
  const hasRooms = rooms && rooms.length > 0;

  // 룸에 배치되지 않은 스텝
  const unzonedSteps = useMemo(
    () => steps.filter((s) => !rooms?.some((r) => r.name === s.zone)),
    [steps, rooms],
  );

  return (
    <div
      className="flex flex-wrap gap-3 p-3 rounded-xl border border-white/10 bg-[#0a0b0e] overflow-y-auto"
      style={{ minHeight: '300px', height: 'auto' }}
    >
      {/* RoomBox per room — 독립 레이아웃 단위, 겹침 없음 */}
      {hasRooms &&
        rooms.map((room, i) => (
          <RoomBox
            key={room.name}
            room={room}
            index={i}
            steps={steps.filter((s) => s.zone === room.name)}
            selectedStepId={selectedStepId}
            editable={editable}
            onSelectStep={onSelectStep}
            onStepMove={onStepMove}
          />
        ))}

      {/* 미배치 스텝 영역 */}
      {unzonedSteps.length > 0 && (
        <div className="relative flex-shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] min-w-[200px] min-h-[150px]">
          <div className="px-2.5 py-1.5 text-xs text-white/25 select-none">
            미배치 ({unzonedSteps.length}스텝)
          </div>
          {unzonedSteps.map((step) => (
            <StepPin
              key={step.id}
              step={step}
              isSelected={step.id === selectedStepId}
              onClick={onSelectStep}
              draggable={false}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!hasRooms && steps.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-white/20 text-sm min-h-[200px]">
          Step이 없습니다
        </div>
      )}
    </div>
  );
}
