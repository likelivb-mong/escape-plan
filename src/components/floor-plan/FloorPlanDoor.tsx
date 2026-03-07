import type { DoorLayout, DoorType } from '../../types/floorPlan';

// ── Door type cycle & labels ──────────────────────────────────────────────────

const DOOR_TYPES: DoorType[] = ['swing', 'double', 'bifold', 'sliding'];

const DOOR_TYPE_LABELS: Record<DoorType, string> = {
  swing: '단짝',
  double: '양짝',
  bifold: '접이',
  sliding: '미닫이',
};

// ── SVG door symbols (thin line, architectural style) ─────────────────────────
// All viewBox="0 0 100 100", stroke only, no fill.

function SwingDoorSvg() {
  // Hinge at (12,10). Door leaf open → horizontal. Arc sweeps 90° CW to closed.
  // radius = 80: (12+80,10)=(92,10) open, (12,10+80)=(12,90) closed
  return (
    <>
      {/* Wall jamb (hinge side) */}
      <line x1="12" y1="0" x2="12" y2="100" strokeWidth="4" />
      {/* Door leaf (shown in open/horizontal position) */}
      <line x1="12" y1="10" x2="92" y2="10" strokeWidth="2" />
      {/* Swing arc: center (12,10) r=80, from open (92,10) CW to closed (12,90) */}
      <path d="M 92,10 A 80,80 0 0,1 12,90" strokeWidth="2" fill="none" />
    </>
  );
}

function DoubleDoorSvg() {
  // Two opposing swing doors meeting at center.
  // Left jamb at x=8, right jamb at x=92. Each leaf r=42.
  // Left: center (8,10), r=42 → open (50,10), closed (8,52)
  // Right: center (92,10), r=42 → open (50,10), closed (92,52)
  return (
    <>
      {/* Left jamb */}
      <line x1="8" y1="0" x2="8" y2="100" strokeWidth="4" />
      {/* Right jamb */}
      <line x1="92" y1="0" x2="92" y2="100" strokeWidth="4" />
      {/* Left door leaf */}
      <line x1="8" y1="10" x2="50" y2="10" strokeWidth="2" />
      {/* Left arc: (50,10) CW to (8,52) */}
      <path d="M 50,10 A 42,42 0 0,1 8,52" strokeWidth="2" fill="none" />
      {/* Right door leaf */}
      <line x1="92" y1="10" x2="50" y2="10" strokeWidth="2" />
      {/* Right arc: (50,10) CCW to (92,52) */}
      <path d="M 50,10 A 42,42 0 0,0 92,52" strokeWidth="2" fill="none" />
    </>
  );
}

function BifoldDoorSvg() {
  // Two folding panels across the opening.
  // Wall line at top (y=8). Two V-shapes representing folded panels.
  // Left V: hinge at (10,8), fold peak at (35,62), meets center (55,8)
  // Right V: hinge at (90,8), fold peak at (65,62), meets center (55,8)
  return (
    <>
      {/* Top wall line (opening width) */}
      <line x1="0" y1="8" x2="100" y2="8" strokeWidth="4" />
      {/* Left panel — two segments forming V */}
      <line x1="10" y1="8" x2="33" y2="60" strokeWidth="2" />
      <line x1="33" y1="60" x2="55" y2="8" strokeWidth="2" />
      {/* Right panel */}
      <line x1="90" y1="8" x2="67" y2="60" strokeWidth="2" />
      <line x1="67" y1="60" x2="55" y2="8" strokeWidth="2" />
      {/* Hinge dots */}
      <circle cx="10" cy="8" r="3" />
      <circle cx="90" cy="8" r="3" />
    </>
  );
}

function SlidingDoorSvg() {
  // Wall stubs on both sides. Door panel (solid rect) + ghost open position (dashed).
  return (
    <>
      {/* Left wall stub */}
      <line x1="5" y1="0" x2="5" y2="100" strokeWidth="4" />
      {/* Right wall stub */}
      <line x1="95" y1="0" x2="95" y2="100" strokeWidth="4" />
      {/* Door panel — current (closed) position */}
      <rect x="8" y="32" width="52" height="36" fill="none" strokeWidth="2" />
      {/* Door ghost — open position (dashed) */}
      <rect x="40" y="32" width="52" height="36" fill="none" strokeWidth="1.5"
        strokeDasharray="5,3" strokeOpacity="0.45" />
      {/* Slide arrow */}
      <line x1="18" y1="50" x2="48" y2="50" strokeWidth="1.5" />
      <path d="M 44,46 L 50,50 L 44,54" fill="none" strokeWidth="1.5" />
    </>
  );
}

function DoorSymbol({ type }: { type: DoorType }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      stroke="currentColor"
      fill="currentColor"
    >
      {type === 'swing'   && <SwingDoorSvg />}
      {type === 'double'  && <DoubleDoorSvg />}
      {type === 'bifold'  && <BifoldDoorSvg />}
      {type === 'sliding' && <SlidingDoorSvg />}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FloorPlanDoorProps {
  door: DoorLayout;
  isEditing: boolean;
  onMoveStart: (id: string, e: React.PointerEvent) => void;
  onResizeStart: (id: string, e: React.PointerEvent) => void;
  onRotate: (id: string) => void;
  onChangeType: (id: string, type: DoorType) => void;
  onDelete: (id: string) => void;
}

export default function FloorPlanDoor({
  door,
  isEditing,
  onMoveStart,
  onResizeStart,
  onRotate,
  onChangeType,
  onDelete,
}: FloorPlanDoorProps) {
  const nextType = () => {
    const idx = DOOR_TYPES.indexOf(door.type ?? 'swing');
    return DOOR_TYPES[(idx + 1) % DOOR_TYPES.length];
  };

  return (
    <div
      className={`absolute select-none text-white/65 ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      style={{
        left: `${door.x}%`,
        top: `${door.y}%`,
        width: `${door.width}%`,
        height: `${door.height}%`,
        transform: `rotate(${door.rotation}deg)`,
      }}
      onPointerDown={isEditing ? (e) => {
        if ((e.target as HTMLElement).closest('[data-door-handle]')) return;
        onMoveStart(door.id, e);
      } : undefined}
    >
      <DoorSymbol type={door.type ?? 'swing'} />

      {isEditing && (
        <>
          {/* Delete — top-left */}
          <button
            data-door-handle="true"
            onClick={(e) => { e.stopPropagation(); onDelete(door.id); }}
            className="absolute -top-2.5 -left-2.5 w-4 h-4 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/40 hover:bg-rose-500/40 hover:text-rose-300 hover:border-rose-400/50 transition-colors leading-none text-caption"
          >
            ×
          </button>

          {/* Type cycle — bottom-left */}
          <button
            data-door-handle="true"
            onClick={(e) => { e.stopPropagation(); onChangeType(door.id, nextType()); }}
            title="문 종류 변경"
            className="absolute -bottom-2.5 -left-2.5 px-1 h-4 rounded-full bg-black/60 border border-white/20 text-micro text-white/40 hover:text-white/70 hover:border-white/30 transition-colors whitespace-nowrap"
          >
            {DOOR_TYPE_LABELS[door.type ?? 'swing']}
          </button>

          {/* Rotate — top-right */}
          <button
            data-door-handle="true"
            onClick={(e) => { e.stopPropagation(); onRotate(door.id); }}
            title="90° 회전"
            className="absolute -top-2.5 -right-2.5 w-4 h-4 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M 8,1.5 A 3.5,3.5 0 1,0 9,5" />
              <path d="M 8,1.5 L 10,0 M 8,1.5 L 6.5,0" />
            </svg>
          </button>

          {/* Resize — bottom-right */}
          <div
            data-door-handle="true"
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-se-resize text-white/25 hover:text-white/50 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart(door.id, e); }}
          >
            <svg viewBox="0 0 14 14" className="w-full h-full">
              <path d="M12 2L2 12M12 6L6 12M12 10L10 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
