import { useState, useEffect, useCallback } from 'react';
import type { ChatUser, ChatRoom, ChatMessage, ChatMember } from '../types/chat';
import {
  getChatUser,
  fetchAllRooms,
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

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!user) return;
    const allRooms = await fetchAllRooms();

    // Fetch last messages + unread counts
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

    // Sort by last activity
    enriched.sort((a, b) => {
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
    const sub = subscribeToRoomUpdates(() => {
      loadRooms();
    });
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

      // Auto-join room if not a member
      const isMember = mems.some((m) => m.user_id === user.id);
      if (!isMember) {
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
  }, [selectedRoomId, user]);

  // Subscribe to new messages in selected room
  useEffect(() => {
    if (!selectedRoomId || !user) return;

    const sub = subscribeToMessages(selectedRoomId, (newMsg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Mark as read
      if (newMsg.sender_id !== user.id) {
        markAsRead(newMsg.id, user.id);
      }

      // Refresh rooms to update last message
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

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    await joinRoom(roomId, user);
    setSelectedRoomId(roomId);
    setMobileShowChat(true);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Profile not set
  if (!user) {
    return <ChatProfileSetup onComplete={setUser} />;
  }

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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: '#6366f130',
                color: '#6366f1',
              }}
            >
              {user.name.slice(0, 2)}
            </div>
            <div>
              <div className="text-xs font-medium text-white/70">{user.name}</div>
              <div className="text-[10px] text-white/30">{user.branchCode ?? ''} · {
                user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '크루'
              }</div>
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
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
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

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden">
                <ChatMessageArea
                  messages={messages}
                  currentUser={user}
                  roomName={selectedRoom.name}
                  members={members}
                />
              </div>
              <ChatInput onSend={handleSendMessage} />
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
