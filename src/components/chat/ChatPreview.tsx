import { useState } from 'react';
import type { ChatRoom, ChatMessage, ChatMember, ChatUser, WorkStatus } from '../../types/chat';
import { SYSTEM_SENDER_ID } from '../../types/chat';
import ChatRoomList from './ChatRoomList';
import ChatMessageArea from './ChatMessageArea';
import ChatInput from './ChatInput';

// ── 목업 데이터 ────────────────────────────────────────────────────────────

const MOCK_USER: ChatUser = {
  id: 'preview-me',
  name: '나 (테스트)',
  role: 'crew',
  branchCode: 'GDXC',
};

const MOCK_BRANCH_ROOM: ChatRoom = {
  id: 'room-gdxc',
  name: '엑스케이프 건대1호점',
  type: 'group',
  avatar_color: '#6366f1',
  branch_code: 'GDXC',
  created_at: '2026-03-08T00:00:00Z',
  updated_at: '2026-03-08T22:30:00Z',
};

const MOCK_DM_ROOM: ChatRoom = {
  id: 'room-dm',
  name: '허정인',
  type: '1on1',
  avatar_color: '#14b8a6',
  created_at: '2026-03-08T00:00:00Z',
  updated_at: '2026-03-08T17:00:00Z',
  lastMessage: { id: 'dm1', room_id: 'room-dm', sender_id: 'u1', sender_name: '허정인', sender_role: 'crew-leader', content: '오늘 마감 부탁해요!', read_by: [], created_at: '2026-03-08T17:00:00Z' },
};

const MOCK_ROOMS: ChatRoom[] = [
  {
    ...MOCK_BRANCH_ROOM,
    memberCount: 4,
    unreadCount: 2,
    lastMessage: { id: 'm7', room_id: 'room-gdxc', sender_id: SYSTEM_SENDER_ID, sender_name: '시스템', sender_role: 'system', content: '3월 8일 (일) 오후 4:00 나 (테스트) 출근했습니다.', read_by: [], created_at: '2026-03-08T16:00:00Z' },
  },
  MOCK_DM_ROOM,
];

const BASE_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    room_id: 'room-gdxc',
    sender_id: SYSTEM_SENDER_ID,
    sender_name: '시스템',
    sender_role: 'system',
    content: '3월 8일 (일) 오전 11:30 허정인 출근했습니다.',
    read_by: ['u1'],
    created_at: '2026-03-08T11:30:00Z',
  },
  {
    id: 'm2',
    room_id: 'room-gdxc',
    sender_id: 'u1',
    sender_name: '허정인',
    sender_role: 'crew-leader',
    content: '안녕하세요! 오늘도 잘 부탁드려요 😊',
    read_by: ['u1'],
    created_at: '2026-03-08T11:32:00Z',
  },
  {
    id: 'm3',
    room_id: 'room-gdxc',
    sender_id: SYSTEM_SENDER_ID,
    sender_name: '시스템',
    sender_role: 'system',
    content: '3월 8일 (일) 오후 1:00 이현서 출근했습니다.',
    read_by: ['u1', 'u2'],
    created_at: '2026-03-08T13:00:00Z',
  },
  {
    id: 'm4',
    room_id: 'room-gdxc',
    sender_id: 'u2',
    sender_name: '이현서',
    sender_role: 'crew',
    content: '네 잘 부탁드립니다!',
    read_by: ['u1', 'u2'],
    created_at: '2026-03-08T13:02:00Z',
  },
  {
    id: 'm5',
    room_id: 'room-gdxc',
    sender_id: SYSTEM_SENDER_ID,
    sender_name: '시스템',
    sender_role: 'system',
    content: '3월 8일 (일) 오후 4:00 나 (테스트) 출근했습니다.',
    read_by: ['u1', 'u2', 'preview-me'],
    created_at: '2026-03-08T16:00:00Z',
  },
  {
    id: 'm6',
    room_id: 'room-gdxc',
    sender_id: 'u1',
    sender_name: '허정인',
    sender_role: 'crew-leader',
    content: '오늘 예약 많아요! 3시에 풀방입니다 🔥',
    read_by: ['u1', 'u2', 'preview-me'],
    created_at: '2026-03-08T16:05:00Z',
  },
];

const MOCK_MEMBERS: ChatMember[] = [
  { id: 'cm1', room_id: 'room-gdxc', user_id: 'u1', user_name: '허정인', user_role: 'crew-leader', branch_code: 'GDXC', joined_at: '2026-03-08T11:30:00Z' },
  { id: 'cm2', room_id: 'room-gdxc', user_id: 'u2', user_name: '이현서', user_role: 'crew', branch_code: 'GDXC', joined_at: '2026-03-08T13:00:00Z' },
  { id: 'cm3', room_id: 'room-gdxc', user_id: 'preview-me', user_name: '나 (테스트)', user_role: 'crew', branch_code: 'GDXC', joined_at: '2026-03-08T16:00:00Z' },
];

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function ChatPreview({ onClose }: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-gdxc');
  const [messages, setMessages] = useState<ChatMessage[]>(BASE_MESSAGES);
  const [workStatus, setWorkStatus] = useState<WorkStatus | null>({
    userId: 'preview-me',
    branchCode: 'GDXC',
    branchRoomId: 'room-gdxc',
  });
  const [filter, setFilter] = useState<'all' | '1on1' | 'group'>('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const selectedRoom = MOCK_ROOMS.find((r) => r.id === selectedRoomId) ?? MOCK_ROOMS[0];
  const isBranchRoom = !!selectedRoom.branch_code;
  const isLocked = isBranchRoom && workStatus?.branchRoomId !== selectedRoomId;

  const handleClockIn = () => {
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    const sysMsg: ChatMessage = {
      id: `sys-in-${Date.now()}`,
      room_id: 'room-gdxc',
      sender_id: SYSTEM_SENDER_ID,
      sender_name: '시스템',
      sender_role: 'system',
      content: `${dateStr} ${timeStr} ${MOCK_USER.name} 출근했습니다.`,
      read_by: ['preview-me'],
      created_at: now,
    };
    setMessages((prev) => [...prev, sysMsg]);
    setWorkStatus({ userId: 'preview-me', branchCode: 'GDXC', branchRoomId: 'room-gdxc' });
  };

  const handleClockOut = () => {
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    const sysMsg: ChatMessage = {
      id: `sys-out-${Date.now()}`,
      room_id: 'room-gdxc',
      sender_id: SYSTEM_SENDER_ID,
      sender_name: '시스템',
      sender_role: 'system',
      content: `${dateStr} ${timeStr} ${MOCK_USER.name} 퇴근했습니다.`,
      read_by: ['preview-me'],
      created_at: now,
    };
    setMessages((prev) => [...prev, sysMsg]);
    setWorkStatus(null);
  };

  const handleSend = (content: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: selectedRoomId,
      sender_id: 'preview-me',
      sender_name: MOCK_USER.name,
      sender_role: MOCK_USER.role,
      content,
      read_by: ['preview-me'],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl border border-white/[0.10] bg-[#111118] overflow-hidden shadow-2xl">

        {/* 미리보기 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300">채팅 미리보기 (목업 데이터)</span>
            <span className="text-[10px] text-indigo-400/50 ml-2">실제 Supabase와 연결되지 않음</span>
          </div>
          <div className="flex items-center gap-3">
            {/* 퇴근 상태 토글 (테스트용) */}
            <button
              onClick={workStatus ? handleClockOut : handleClockIn}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                workStatus
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              }`}
            >
              {workStatus ? '퇴근 상태로 전환' : '출근 상태로 전환'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 채팅 UI */}
        <div className="flex flex-1 min-h-0">
          {/* Left */}
          <div className={`w-72 border-r border-white/[0.06] flex-shrink-0 flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 relative">
                나테
                {workStatus && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#111118]" />}
              </div>
              <div>
                <div className="text-xs font-medium text-white/70 flex items-center gap-1">
                  나 (테스트)
                  {workStatus && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">근무중</span>}
                </div>
                <div className="text-[10px] text-white/30">GDXC · 크루</div>
              </div>
            </div>
            <ChatRoomList
              rooms={MOCK_ROOMS}
              selectedRoomId={selectedRoomId}
              currentUser={MOCK_USER}
              workStatus={workStatus}
              onSelectRoom={(id) => { setSelectedRoomId(id); setMobileShowChat(true); }}
              onCreateRoom={() => {}}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>

          {/* Right */}
          <div className={`flex-1 flex flex-col min-w-0 relative ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
            <div className="flex-1 overflow-hidden">
              <ChatMessageArea
                messages={selectedRoomId === 'room-gdxc' ? messages : []}
                currentUser={MOCK_USER}
                roomName={selectedRoom.name}
                members={selectedRoomId === 'room-gdxc' ? MOCK_MEMBERS : []}
                branchCode={selectedRoom.branch_code}
                workStatus={workStatus}
                branchRoomId={selectedRoomId}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
              />
            </div>

            {/* 퇴근 잠금 오버레이 */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-4 text-center px-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/60">퇴근 상태입니다</p>
                    <p className="text-xs text-white/30 mt-1">출근하기를 눌러 채팅에 참여하세요</p>
                  </div>
                  <button
                    onClick={handleClockIn}
                    className="mt-1 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                  >
                    출근하기
                  </button>
                </div>
              </div>
            )}

            {!isLocked && workStatus && <ChatInput onSend={handleSend} />}
            {!isLocked && !workStatus && isBranchRoom && (
              <div className="px-4 py-3 border-t border-white/[0.06] text-center text-xs text-white/25">
                출근하기 버튼을 눌러 채팅에 참여하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
