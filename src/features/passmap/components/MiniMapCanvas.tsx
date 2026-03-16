import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import type { ThemeStep, ThemeRoom } from '../types/passmap';
import StepPin from './StepPin';

// 20px 단위 그리드 스냅
const GRID_PX = 20;

const ROOM_COLORS = [
  'rgba(168,130,85,0.5)',
  'rgba(130,168,85,0.4)',
  'rgba(85,130,168,0.4)',
  'rgba(168,85,130,0.4)',
  'rgba(130,85,168,0.4)',
  'rgba(168,155,85,0.4)',
];

const ROOM_NAME_COLORS = [
  '#c8a060', '#90b850', '#60a0c8', '#c86090', '#9060c8', '#c8b060',
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

// ── AABB 충돌 감지 (% 좌표 기준) ──────────────────────────────────────────────
function hasCollision(
  test: { x: number; y: number; width: number; height: number },
  excludeName: string,
  allRooms: ThemeRoom[],
): boolean {
  return allRooms.some((other) => {
    if (other.name === excludeName) return false;
    return (
      test.x < other.x + other.width &&
      test.x + test.width > other.x &&
      test.y < other.y + other.height &&
      test.y + test.height > other.y
    );
  });
}

// ── px → % 변환 유틸 ──────────────────────────────────────────────────────────
function pxToX(px: number, rect: DOMRect) { return (px / rect.width) * 100; }
function pxToY(px: number, rect: DOMRect) { return (px / rect.height) * 100; }
function xToPx(pct: number, rect: DOMRect) { return (pct / 100) * rect.width; }
function yToPx(pct: number, rect: DOMRect) { return (pct / 100) * rect.height; }

// 20px 그리드 스냅 (px 기준, % 반환)
function snapX(pxVal: number, rect: DOMRect) {
  return pxToX(Math.round(pxVal / GRID_PX) * GRID_PX, rect);
}
function snapY(pxVal: number, rect: DOMRect) {
  return pxToY(Math.round(pxVal / GRID_PX) * GRID_PX, rect);
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

  // 컨테이너 실제 픽셀 너비 추적 → 캔버스 높이 자동 계산에 사용
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width),
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // 드래그 중 시각 피드백용 상태
  const [draggedRoom, setDraggedRoom] = useState<{
    name: string; x: number; y: number; width: number; height: number;
  } | null>(null);

  const hasRooms = rooms && rooms.length > 0;

  // rooms의 최대 bottom에 맞춰 캔버스 높이 자동 확장
  const canvasHeight = useMemo(() => {
    if (!containerWidth || !rooms || rooms.length === 0) return 600;
    const maxBottomPct = Math.max(...rooms.map((r) => r.y + r.height));
    // % → px (정사각형 기준에서 20% 여유)
    return Math.max(600, (maxBottomPct / 100) * containerWidth * 1.2);
  }, [rooms, containerWidth]);

  const stepCountByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of steps) map.set(s.zone, (map.get(s.zone) || 0) + 1);
    return map;
  }, [steps]);

  // ── Step 드래그: 룸 내부로 제한 ─────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.MouseEvent, step: ThemeStep) => {
      if (!editable || !onStepMove) return;
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = step.x;
      const origY = step.y;
      const room = rooms?.find((r) => r.name === step.zone);

      const handleMouseMove = (me: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        let newX = origX + pxToX(dx, rect);
        let newY = origY + pxToY(dy, rect);

        if (room) {
          const PIN = 2.5;
          newX = Math.max(room.x + PIN, Math.min(room.x + room.width - PIN, newX));
          newY = Math.max(room.y + PIN, Math.min(room.y + room.height - PIN, newY));
        } else {
          newX = Math.max(2, Math.min(98, newX));
          newY = Math.max(2, Math.min(98, newY));
        }
        onStepMove(step.id, newX, newY);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [editable, onStepMove, rooms],
  );

  // ── Room 드래그 (이동 / 리사이즈) ────────────────────────────────────────────
  const handleRoomDragStart = useCallback(
    (e: React.MouseEvent, room: ThemeRoom, dragType: 'move' | 'resize') => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();

      let lastValidX = room.x;
      let lastValidY = room.y;
      let lastValidW = room.width;
      let lastValidH = room.height;

      const handleMouseMove = (me: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = me.clientX - e.clientX;
        const dy = me.clientY - e.clientY;

        if (dragType === 'move') {
          // px 기준으로 새 위치 계산 후 20px 스냅
          let newPxX = xToPx(room.x, rect) + dx;
          let newPxY = yToPx(room.y, rect) + dy;
          newPxX = Math.round(newPxX / GRID_PX) * GRID_PX;
          newPxY = Math.round(newPxY / GRID_PX) * GRID_PX;

          let newX = pxToX(newPxX, rect);
          let newY = pxToY(newPxY, rect);

          // Rule 1: 캔버스 bounds clamp
          // x >= 0, y >= 0, x + width <= 100, y + height <= 100
          newX = Math.max(0, Math.min(100 - room.width, newX));
          newY = Math.max(0, Math.min(100 - room.height, newY));

          // Rule 3: 충돌 시 마지막 유효 위치 유지
          const testBounds = { x: newX, y: newY, width: room.width, height: room.height };
          if (!hasCollision(testBounds, room.name, rooms ?? [])) {
            lastValidX = newX;
            lastValidY = newY;
          }

          setDraggedRoom({
            name: room.name,
            x: lastValidX, y: lastValidY,
            width: room.width, height: room.height,
          });
        } else {
          // 리사이즈: 우하단 핸들
          let newPxW = xToPx(room.width, rect) + dx;
          let newPxH = yToPx(room.height, rect) + dy;

          // 최소 크기(4 grid) 보장 후 20px 스냅
          newPxW = Math.round(Math.max(GRID_PX * 4, newPxW) / GRID_PX) * GRID_PX;
          newPxH = Math.round(Math.max(GRID_PX * 3, newPxH) / GRID_PX) * GRID_PX;

          let newW = pxToX(newPxW, rect);
          let newH = pxToY(newPxH, rect);

          // Rule 1: 우하단이 캔버스 밖으로 나가지 않도록
          newW = Math.min(newW, 100 - room.x);
          newH = Math.min(newH, 100 - room.y);

          // Rule 3: 충돌 시 마지막 유효 크기 유지
          const testBounds = { x: room.x, y: room.y, width: newW, height: newH };
          if (!hasCollision(testBounds, room.name, rooms ?? [])) {
            lastValidW = newW;
            lastValidH = newH;
          }

          setDraggedRoom({
            name: room.name,
            x: room.x, y: room.y,
            width: lastValidW, height: lastValidH,
          });
        }
      };

      const handleMouseUp = () => {
        // 드래그 종료: 마지막 유효 위치로 확정
        if (dragType === 'move') {
          const deltaX = lastValidX - room.x;
          const deltaY = lastValidY - room.y;
          if (deltaX !== 0 || deltaY !== 0) {
            onRoomMove?.(room.name, deltaX, deltaY);
          }
        } else {
          if (lastValidW !== room.width || lastValidH !== room.height) {
            onRoomUpdate?.(room.name, { width: lastValidW, height: lastValidH });
          }
        }
        setDraggedRoom(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [editable, rooms, onRoomMove, onRoomUpdate],
  );

  return (
    // overflow-x-hidden, overflow-y-auto → Rule 4: 세로 스크롤 허용, 가로 잘림 방지
    <div
      ref={containerRef}
      className="relative w-full rounded-xl border border-white/10 bg-[#0a0b0e] overflow-x-hidden overflow-y-auto"
      style={{ height: `${canvasHeight}px` }}
    >
      {/* 20px 그리드 배경 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: mapImage
            ? `url(${mapImage})`
            : `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: mapImage ? 'cover' : `${GRID_PX}px ${GRID_PX}px`,
          backgroundPosition: '0 0',
        }}
      />

      {/* RoomBox: absolute 자유 배치 */}
      {hasRooms &&
        rooms.map((room, i) => {
          const borderColor = ROOM_COLORS[i % ROOM_COLORS.length];
          const nameColor = ROOM_NAME_COLORS[i % ROOM_NAME_COLORS.length];
          const count = stepCountByZone.get(room.name) ?? room.stepCount;

          // 드래그 중이면 시각 피드백 좌표 사용
          const isDragging = draggedRoom?.name === room.name;
          const dx = isDragging ? draggedRoom.x : room.x;
          const dy = isDragging ? draggedRoom.y : room.y;
          const dw = isDragging ? draggedRoom.width : room.width;
          const dh = isDragging ? draggedRoom.height : room.height;

          return (
            <div
              key={room.name}
              className={`absolute rounded-lg ${editable ? 'cursor-move' : ''}`}
              style={{
                left: `${dx}%`,
                top: `${dy}%`,
                width: `${dw}%`,
                height: `${dh}%`,
                border: `1px solid ${borderColor}`,
                backgroundColor: borderColor.replace(/[\d.]+\)$/, '0.06)'),
              }}
              onMouseDown={editable ? (e) => handleRoomDragStart(e, room, 'move') : undefined}
            >
              {/* Room 헤더 */}
              <div className="flex items-center justify-between px-2.5 py-1.5 select-none pointer-events-none">
                <span className="text-xs font-bold tracking-wide" style={{ color: nameColor }}>
                  {room.name}
                </span>
                <span className="text-[10px] text-white/25 font-medium">
                  {count}스텝
                </span>
              </div>

              {/* 리사이즈 핸들 (우하단) */}
              {editable && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
                  style={{ background: borderColor, borderRadius: '0 0 4px 0' }}
                  onMouseDown={(e) => handleRoomDragStart(e, room, 'resize')}
                  title="드래그로 크기 조정"
                />
              )}
            </div>
          );
        })}

      {/* Step Pins */}
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

      {!hasRooms && (
        <div className="absolute top-4 left-4 text-xs text-white/10 font-mono select-none">
          MAP VIEW
        </div>
      )}

      {steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm pointer-events-none">
          Step이 없습니다
        </div>
      )}
    </div>
  );
}
