import { useRef, useEffect } from 'react';
import type { ChatMessage, ChatUser, ChatMember } from '../../types/chat';

interface Props {
  messages: ChatMessage[];
  currentUser: ChatUser;
  roomName: string;
  members: ChatMember[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444',
  manager: '#f59e0b',
  crew: '#6366f1',
};

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  manager: '매니저',
  crew: '크루',
};

export default function ChatMessageArea({ messages, currentUser, roomName, members }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Group messages by date
  let lastDate = '';

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white/85">{roomName}</h2>
          <span className="text-xs text-white/30">멤버 {members.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all" title="검색">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="p-2 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all" title="멤버">
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
            첫 메시지를 보내보세요!
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === currentUser.id;
          const msgDate = new Date(msg.created_at).toDateString();
          const showDateSep = msgDate !== lastDate;
          lastDate = msgDate;

          // Check if previous message is same sender (for grouping)
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateSep;
          const readCount = getReadCount(msg);

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-4 py-1 rounded-full bg-white/[0.06] text-[11px] text-white/30">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}

              {/* Message */}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}>
                {!isMine && (
                  <div className="flex-shrink-0 mr-2" style={{ width: 36 }}>
                    {!sameSender && (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{
                          backgroundColor: (ROLE_COLORS[msg.sender_role] ?? '#6366f1') + '25',
                          color: ROLE_COLORS[msg.sender_role] ?? '#6366f1',
                        }}
                      >
                        {msg.sender_name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {/* Sender name + role */}
                  {!isMine && !sameSender && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-white/60">{msg.sender_name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (ROLE_COLORS[msg.sender_role] ?? '#6366f1') + '15',
                          color: ROLE_COLORS[msg.sender_role] ?? '#6366f1',
                        }}
                      >
                        {ROLE_LABELS[msg.sender_role] ?? msg.sender_role}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                    {/* Bubble */}
                    <div
                      className={`px-3 py-2 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        isMine
                          ? 'bg-indigo-500/80 text-white rounded-tr-sm'
                          : 'bg-white/[0.08] text-white/80 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Meta: read count + time */}
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
