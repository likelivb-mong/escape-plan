import { useState, useEffect, useCallback } from 'react';
import type { ChatUser, ChatRoom, ChatMessage, ChatMember, WorkStatus } from '../types/chat';
import { ROLE_LABELS, isAdminRole } from '../types/chat';
import {
  getChatUser,
  fetchRoomsForUser,
  ensureBranchRooms,
  joinBranchRooms,
  fetchMessages,
  fetchMembers,
  sendMessage,
  createRoom,
  joinRoom,
  markAsRead,
  getLastMessages,
  getUnreadCounts,
  subscribeToMessages,
  subscribeToRoomUpdates,
  clockIn,
  clockOut,
  getWorkStatus,
  saveWorkStatus,
  clearWorkStatus,
} from '../services/chatService';
import ChatProfileSetup from '../components/chat/ChatProfileSetup';
import ChatRoomList from '../components/chat/ChatRoomList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import ChatInput from '../components/chat/ChatInput';

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#3b82f6',
];

export default function ChatPage() {
  const [user, setUser] = useState<ChatUser | null>(getChatUser());
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [filter, setFilter] = useState<'all' | '1on1' | 'group'>('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [workStatus, setWorkStatus] = useState<WorkStatus | null>(getWorkStatus());

  // Initialize branch rooms and auto-join on first load
  useEffect(() => {
    if (!user) return;
    (async () => {
      const branchRooms = await ensureBranchRooms();
      // 모든 역할: 자신의 지점 채팅방에 멤버로 등록 (관리자는 전체, 크루는 자기 지점)
      // 멤버십은 항상 유지 — 잠금은 UI(workStatus)로만 제어
      await joinBranchRooms(user, branchRooms);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!user) return;
    const allRooms = await fetchRoomsForUser(user);

    const roomIds = allRooms.map((r) => r.id);
    const [lastMsgs, unreads] = await Promise.all([
      getLastMessages(roomIds),
      getUnreadCounts(roomIds, user.id),
    ]);

    const enriched = allRooms.map((r) => ({
      ...r,
      lastMessage: lastMsgs[r.id],
      unreadCount: unreads[r.id] ?? 0,
    }));

    enriched.sort((a, b) => {
      // 지점 목록은 항상 위에
      if (a.branch_code && !b.branch_code) return -1;
      if (!a.branch_code && b.branch_code) return 1;
      const aTime = a.lastMessage?.created_at ?? a.updated_at;
      const bTime = b.lastMessage?.created_at ?? b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setRooms(enriched);
  }, [user]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Subscribe to room updates
  useEffect(() => {
    if (!user) return;
    const sub = subscribeToRoomUpdates(() => { loadRooms(); });
    return () => sub.unsubscribe();
  }, [user, loadRooms]);

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoomId || !user) return;

    let cancelled = false;

    (async () => {
      const [msgs, mems] = await Promise.all([
        fetchMessages(selectedRoomId),
        fetchMembers(selectedRoomId),
      ]);

      if (cancelled) return;
      setMessages(msgs);
      setMembers(mems);

      // 관리자는 자동 참여, 크루는 출근 상태일 때만 참여 (혹은 이미 멤버)
      const isMember = mems.some((m) => m.user_id === user.id);
      const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
      const isBranchRoom = !!selectedRoom?.branch_code;

      if (!isMember && (!isBranchRoom || isAdminRole(user.role))) {
        await joinRoom(selectedRoomId, user);
        const updatedMembers = await fetchMembers(selectedRoomId);
        if (!cancelled) setMembers(updatedMembers);
      }

      // Mark unread messages as read
      for (const msg of msgs) {
        if (!msg.read_by.includes(user.id)) {
          markAsRead(msg.id, user.id);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRoomId, user, rooms]);

  // Subscribe to new messages in selected room
  useEffect(() => {
    if (!selectedRoomId || !user) return;

    const sub = subscribeToMessages(selectedRoomId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        markAsRead(newMsg.id, user.id);
      }
      loadRooms();
    });

    return () => sub.unsubscribe();
  }, [selectedRoomId, user, loadRooms]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMobileShowChat(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedRoomId) return;
    await sendMessage(selectedRoomId, user, content);
  };

  const handleCreateRoom = async (name: string, type: 'group' | '1on1') => {
    if (!user) return;
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const room = await createRoom(name, type, color, user);
    if (room) {
      await loadRooms();
      setSelectedRoomId(room.id);
      setMobileShowChat(true);
    }
  };

  // ── 출근하기 ──────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    if (!user || !selectedRoomId) return;
    const branchRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!branchRoom?.branch_code) return;

    await clockIn(user, branchRoom);

    const status: WorkStatus = {
      userId: user.id,
      branchCode: branchRoom.branch_code,
      branchRoomId: branchRoom.id,
    };
    saveWorkStatus(status);
    setWorkStatus(status);

    // 메시지 새로고침
    const msgs = await fetchMessages(selectedRoomId);
    setMessages(msgs);
    const mems = await fetchMembers(selectedRoomId);
    setMembers(mems);
    loadRooms();
  };

  // ── 퇴근하기 ──────────────────────────────────────────────────────────────
  const handleClockOut = async () => {
    if (!user || !workStatus) return;
    const branchRoom = rooms.find((r) => r.id === workStatus.branchRoomId);
    if (!branchRoom) return;

    await clockOut(user, branchRoom);
    clearWorkStatus();
    setWorkStatus(null);
    // 채팅방은 잠금 상태로 유지 — 방을 닫거나 나가지 않음
    await loadRooms();
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  if (!user) {
    return <ChatProfileSetup onComplete={setUser} />;
  }

  // 현재 선택된 방이 지점 채팅방인지 확인
  const selectedBranchCode = selectedRoom?.branch_code;
  // 크루/크루장이 지점 채팅방에서 퇴근 상태이면 잠금
  const isLocked = !isAdminRole(user.role) &&
    !!selectedBranchCode &&
    workStatus?.branchRoomId !== selectedRoomId;
  const canSendMessage = !isLocked;

  return (
    <div className="h-[calc(100vh-48px)] flex">
      {/* Left: Room list */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/[0.06] flex-shrink-0 ${
        mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'
      }`}>
        {/* User info header */}
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold relative"
              style={{ backgroundColor: '#6366f130', color: '#6366f1' }}
            >
              {user.name.slice(0, 2)}
              {/* 출근 중 상태 표시 */}
              {workStatus && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#1a1a2e]" />
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-white/70 flex items-center gap-1">
                {user.name}
                {workStatus && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                    근무중
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/30">{user.branchCode ?? ''} · {ROLE_LABELS[user.role]}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('xcape-chat-user');
              setUser(null);
            }}
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            프로필 변경
          </button>
        </div>

        <ChatRoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          currentUser={user}
          workStatus={workStatus}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Right: Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        !mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedRoom ? (
          <>
            {/* Mobile back button */}
            <div className="md:hidden flex items-center px-2 py-1 border-b border-white/[0.06]">
              <button
                onClick={() => setMobileShowChat(false)}
                className="p-2 rounded-md text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-white/70 ml-1">{selectedRoom.name}</span>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-hidden">
                <ChatMessageArea
                  messages={messages}
                  currentUser={user}
                  roomName={selectedRoom.name}
                  members={members}
                  branchCode={selectedBranchCode}
                  workStatus={workStatus}
                  branchRoomId={selectedRoomId ?? undefined}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                />
              </div>

              {/* 퇴근 상태 잠금 오버레이 */}
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

              {!isLocked && canSendMessage && <ChatInput onSend={handleSendMessage} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-caption">채팅방을 선택하거나 새로운 채팅을 시작하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
