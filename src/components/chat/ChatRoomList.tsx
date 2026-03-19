import { useState } from 'react';
import type { ChatRoom, ChatUser } from '../../types/chat';
import { isAdminRole } from '../../types/chat';

const BRANCH_CODE_COLORS: Record<string, string> = {
  'GDXC': '#6366f1', 'GDXR': '#ec4899', 'NWXC': '#14b8a6',
  'GNXC': '#f59e0b', 'SWXC': '#ef4444',
};

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#3b82f6',
];

interface Props {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  currentUser: ChatUser;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, type: 'group' | '1on1') => void;
  onJoinRoom: (roomId: string) => void;
  filter: 'all' | '1on1' | 'group';
  onFilterChange: (f: 'all' | '1on1' | 'group') => void;
}

export default function ChatRoomList({
  rooms, selectedRoomId, currentUser, onSelectRoom, onCreateRoom, onJoinRoom,
  filter, onFilterChange,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | '1on1'>('group');

  const filtered = rooms.filter((r) => filter === 'all' || r.type === filter);

  const handleCreate = () => {
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim(), newRoomType);
    setNewRoomName('');
    setShowCreate(false);
  };

  // 관리자 직급만 새 채팅방 생성 가능
  const canCreateRoom = isAdminRole(currentUser.role);

  const getBranchBadge = (room: ChatRoom) => {
    if (!room.branch_code) return null;
    const color = BRANCH_CODE_COLORS[room.branch_code] ?? '#6366f1';
    return (
      <span
        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full ml-1"
        style={{ backgroundColor: color + '20', color }}
      >
        지점
      </span>
    );
  };

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

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
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

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 pb-2 border-b border-white/[0.06]">
        {([['all', '전체'], ['1on1', '1:1'], ['group', '그룹']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === key
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Sort */}
        <button className="p-1.5 rounded-md text-white/25 hover:text-white/45 hover:bg-white/[0.04] transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h12M3 17h6" />
          </svg>
        </button>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/25 text-caption">
            <svg className="w-10 h-10 mb-3 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            채팅방이 없습니다
          </div>
        )}

        {filtered.map((room) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 transition-all text-left ${
                isSelected
                  ? 'bg-white/[0.08]'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: room.avatar_color + '30', color: room.avatar_color }}
              >
                {getInitials(room.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80 truncate flex items-center">
                    {room.name}
                    {getBranchBadge(room)}
                    {room.memberCount != null && (
                      <span className="text-white/25 ml-1">{room.memberCount}</span>
                    )}
                  </span>
                  <span className="text-[10px] text-white/25 flex-shrink-0 ml-2">
                    {formatTime(room.lastMessage?.created_at ?? room.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-white/35 truncate">
                    {room.lastMessage?.content ?? '새로운 채팅방'}
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
        })}
      </div>

      {/* Create room button */}
      <div className="p-3 border-t border-white/[0.06]">
        {!canCreateRoom ? (
          <div className="text-center text-[10px] text-white/20 py-1">
            채팅방 생성은 매니저 이상만 가능합니다
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
