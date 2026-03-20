import { useState } from 'react';
import type { ChatRoom, ChatUser, WorkStatus } from '../../types/chat';
import { isAdminRole } from '../../types/chat';

export const BRANCH_CODE_COLORS: Record<string, string> = {
  'GDXC': '#6366f1', 'GDXR': '#ec4899', 'NWXC': '#14b8a6',
  'GNXC': '#f59e0b', 'SWXC': '#ef4444',
};

const BRANCH_NAMES: Record<string, string> = {
  'GDXC': '건대엑스',
  'GDXR': '건대크라임',
  'NWXC': '건대뉴케',
  'GNXC': '강남점',
  'SWXC': '수원점',
};

interface Props {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  currentUser: ChatUser;
  workStatus: WorkStatus | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, type: 'group' | '1on1') => void;
  filter: 'all' | '1on1' | 'group';
  onFilterChange: (f: 'all' | '1on1' | 'group') => void;
}

export default function ChatRoomList({
  rooms, selectedRoomId, currentUser, workStatus, onSelectRoom, onCreateRoom,
  filter, onFilterChange,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | '1on1'>('group');

  const branchRooms = rooms.filter((r) => r.branch_code);
  const regularRooms = rooms.filter((r) => !r.branch_code);
  const filteredRegular = regularRooms.filter((r) => filter === 'all' || r.type === filter);

  const handleCreate = () => {
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim(), newRoomType);
    setNewRoomName('');
    setShowCreate(false);
  };

  const canCreateRoom = isAdminRole(currentUser.role);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  };

  const renderRoomItem = (room: ChatRoom) => {
    const isSelected = room.id === selectedRoomId;
    const color = room.branch_code
      ? (BRANCH_CODE_COLORS[room.branch_code] ?? '#6366f1')
      : room.avatar_color;
    const label = room.branch_code
      ? (BRANCH_NAMES[room.branch_code] ?? room.branch_code)
      : room.name;
    const shortLabel = room.branch_code ?? room.name.slice(0, 2);
    const isClockedInHere = workStatus?.branchRoomId === room.id;

    return (
      <button
        key={room.id}
        onClick={() => onSelectRoom(room.id)}
        className={`w-full flex items-start gap-3 px-3 py-3 transition-all text-left ${
          isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
        }`}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: color + '30', color }}
          >
            {shortLabel.slice(0, 2)}
          </div>
          {isClockedInHere && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1a1a2e]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80 truncate flex items-center gap-1">
              {room.branch_code && (
                <span className="text-[9px] font-bold tracking-wider" style={{ color }}>
                  {room.branch_code}
                </span>
              )}
              <span>{label}</span>
            </span>
            <span className="text-[10px] text-white/25 flex-shrink-0 ml-2">
              {formatTime(room.lastMessage?.created_at ?? room.updated_at)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-white/35 truncate">
              {room.lastMessage?.content ?? (room.branch_code ? '지점 채팅방' : '새로운 채팅방')}
            </p>
            {(room.unreadCount ?? 0) > 0 && (
              <span className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="메시지 검색"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white/70 placeholder-white/25 outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {branchRooms.length > 0 && (
          <div>
            <div className="px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-white/30 tracking-wider uppercase">지점 목록</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            {branchRooms.map(renderRoomItem)}
          </div>
        )}

        <div>
          <div className="flex items-center gap-1 px-3 py-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-semibold text-white/30 tracking-wider uppercase mr-1">채팅</span>
            {([['all', '전체'], ['1on1', '1:1'], ['group', '그룹']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  filter === key
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredRegular.length === 0 && (
            <div className="flex flex-col items-center py-8 text-white/20 text-caption">
              <svg className="w-8 h-8 mb-2 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              채팅방이 없습니다
            </div>
          )}
          {filteredRegular.map(renderRoomItem)}
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        {!canCreateRoom ? (
          <div className="text-center text-[10px] text-white/20 py-1">
            채팅방 생성은 관리자 이상만 가능합니다
          </div>
        ) : showCreate ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="채팅방 이름"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.10] text-sm text-white outline-none focus:border-white/25"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewRoomType('group')}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  newRoomType === 'group'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/40'
                }`}
              >
                그룹
              </button>
              <button
                onClick={() => setNewRoomType('1on1')}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  newRoomType === '1on1'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/40'
                }`}
              >
                1:1
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] text-white/40 text-xs font-medium hover:bg-white/[0.08] transition-all"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newRoomName.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-all disabled:opacity-30"
              >
                만들기
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 채팅
          </button>
        )}
      </div>
    </div>
  );
}
