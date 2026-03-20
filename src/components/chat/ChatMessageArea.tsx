import { useRef, useEffect } from 'react';
import type { ChatMessage, ChatUser, ChatMember, WorkStatus } from '../../types/chat';
import { SYSTEM_SENDER_ID, ROLE_LABELS, isAdminRole } from '../../types/chat';

interface Props {
  messages: ChatMessage[];
  currentUser: ChatUser;
  roomName: string;
  members: ChatMember[];
  branchCode?: string;
  workStatus: WorkStatus | null;
  branchRoomId?: string;
  isClocking: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  'crew': '#6366f1',
  'crew-leader': '#14b8a6',
  'master-admin': '#ec4899',
  'gdxc-admin': '#6366f1',
  'gdxr-admin': '#ec4899',
  'nwxc-admin': '#14b8a6',
  'gnxc-admin': '#f59e0b',
  'swxc-admin': '#ef4444',
  'system': '#ffffff',
};

export default function ChatMessageArea({
  messages, currentUser, roomName, members,
  branchCode, workStatus, branchRoomId, isClocking, onClockIn, onClockOut,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBranchRoom = !!branchCode;
  const isClockedIn = workStatus?.branchRoomId === branchRoomId;
  const canClockInOut = isBranchRoom && !isAdminRole(currentUser.role);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  const getReadCount = (msg: ChatMessage) => {
    const totalMembers = members.length;
    const readCount = (msg.read_by ?? []).length;
    const unread = totalMembers - readCount;
    return unread > 0 ? unread : 0;
  };

  let lastDate = '';

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white/85">{roomName}</h2>
          <span className="text-xs text-white/30">멤버 {members.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 출근/퇴근 버튼 (크루/크루장, 지점 채팅방에서만) */}
          {canClockInOut && (
            isClockedIn ? (
              <button
                onClick={onClockOut}
                disabled={isClocking}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isClocking ? '처리 중...' : '퇴근하기'}
              </button>
            ) : (
              <button
                onClick={onClockIn}
                disabled={isClocking}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isClocking ? '처리 중...' : '출근하기'}
              </button>
            )
          )}

          <button className="p-2 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-caption">
            <svg className="w-12 h-12 mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {canClockInOut && !isClockedIn ? '출근하기 버튼을 눌러 채팅에 참여하세요' : '첫 메시지를 보내보세요!'}
          </div>
        )}

        {messages.map((msg, idx) => {
          const isSystem = msg.sender_id === SYSTEM_SENDER_ID;
          const isMine = msg.sender_id === currentUser.id;
          const msgDate = new Date(msg.created_at).toDateString();
          const showDateSep = msgDate !== lastDate;
          lastDate = msgDate;

          // 시스템 메시지: 중앙 알림 스타일
          if (isSystem) {
            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-4 py-1 rounded-full bg-white/[0.06] text-[11px] text-white/30">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center my-2">
                  <span className="px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-[11px] text-white/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 flex-shrink-0" />
                    {msg.content}
                  </span>
                </div>
              </div>
            );
          }

          // 일반 메시지
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const prevIsSystem = prevMsg?.sender_id === SYSTEM_SENDER_ID;
          const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateSep && !prevIsSystem;
          const readCount = getReadCount(msg);
          const roleColor = ROLE_COLORS[msg.sender_role] ?? '#6366f1';

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-4 py-1 rounded-full bg-white/[0.06] text-[11px] text-white/30">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}

              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}>
                {!isMine && (
                  <div className="flex-shrink-0 mr-2" style={{ width: 36 }}>
                    {!sameSender && (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: roleColor + '25', color: roleColor }}
                      >
                        {msg.sender_name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isMine && !sameSender && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-white/60">{msg.sender_name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: roleColor + '15', color: roleColor }}
                      >
                        {ROLE_LABELS[msg.sender_role as keyof typeof ROLE_LABELS] ?? msg.sender_role}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`px-3 py-2 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        isMine
                          ? 'bg-indigo-500/80 text-white rounded-tr-sm'
                          : 'bg-white/[0.08] text-white/80 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className={`flex flex-col gap-0 flex-shrink-0 ${isMine ? 'items-end' : 'items-start'}`}>
                      {readCount > 0 && (
                        <span className="text-[10px] text-indigo-400/70">{readCount}</span>
                      )}
                      <span className="text-[10px] text-white/20">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
