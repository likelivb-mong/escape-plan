import { supabase } from './supabase';
import type { ChatRoom, ChatMessage, ChatMember, ChatUser } from '../types/chat';

const CHAT_USER_KEY = 'xcape-chat-user';

// ── User profile (localStorage) ─────────────────────────────────────────────

export function getChatUser(): ChatUser | null {
  const raw = localStorage.getItem(CHAT_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveChatUser(user: ChatUser): void {
  localStorage.setItem(CHAT_USER_KEY, JSON.stringify(user));
}

// ── Rooms ───────────────────────────────────────────────────────────────────

export async function fetchRooms(userId: string): Promise<ChatRoom[]> {
  if (!supabase) return [];

  // Get rooms that this user is a member of
  const { data: memberships } = await supabase
    .from('chat_members')
    .select('room_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) return [];

  const roomIds = memberships.map((m: { room_id: string }) => m.room_id);
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('*')
    .in('id', roomIds)
    .order('updated_at', { ascending: false });

  return (rooms ?? []) as ChatRoom[];
}

export async function fetchAllRooms(): Promise<ChatRoom[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('updated_at', { ascending: false });
  return (data ?? []) as ChatRoom[];
}

export async function createRoom(name: string, type: 'group' | '1on1', avatarColor: string, creatorUser: ChatUser): Promise<ChatRoom | null> {
  if (!supabase) return null;

  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert({ name, type, avatar_color: avatarColor })
    .select()
    .single();

  if (error || !room) return null;

  // Add creator as member
  await supabase.from('chat_members').insert({
    room_id: room.id,
    user_id: creatorUser.id,
    user_name: creatorUser.name,
    user_role: creatorUser.role,
    branch_code: creatorUser.branchCode,
  });

  return room as ChatRoom;
}

export async function joinRoom(roomId: string, user: ChatUser): Promise<void> {
  if (!supabase) return;

  await supabase.from('chat_members').upsert({
    room_id: roomId,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    branch_code: user.branchCode,
  }, { onConflict: 'room_id,user_id' });
}

// ── Members ─────────────────────────────────────────────────────────────────

export async function fetchMembers(roomId: string): Promise<ChatMember[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  return (data ?? []) as ChatMember[];
}

// ── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(roomId: string, limit = 100): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(roomId: string, user: ChatUser, content: string): Promise<ChatMessage | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      content,
      read_by: [user.id],
    })
    .select()
    .single();

  if (error) return null;

  // Update room's updated_at
  await supabase
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId);

  return data as ChatMessage;
}

export async function markAsRead(messageId: string, userId: string): Promise<void> {
  if (!supabase) return;

  // Fetch current read_by
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('read_by')
    .eq('id', messageId)
    .single();

  if (!msg) return;
  const readBy: string[] = msg.read_by ?? [];
  if (readBy.includes(userId)) return;

  await supabase
    .from('chat_messages')
    .update({ read_by: [...readBy, userId] })
    .eq('id', messageId);
}

export async function getLastMessages(roomIds: string[]): Promise<Record<string, ChatMessage>> {
  if (!supabase || roomIds.length === 0) return {};

  const result: Record<string, ChatMessage> = {};
  // Fetch last message per room
  for (const roomId of roomIds) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      result[roomId] = data[0] as ChatMessage;
    }
  }
  return result;
}

export async function getUnreadCounts(roomIds: string[], userId: string): Promise<Record<string, number>> {
  if (!supabase || roomIds.length === 0) return {};

  const result: Record<string, number> = {};
  for (const roomId of roomIds) {
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .not('read_by', 'cs', `["${userId}"]`);
    result[roomId] = count ?? 0;
  }
  return result;
}

// ── Realtime ────────────────────────────────────────────────────────────────

export function subscribeToMessages(roomId: string, onMessage: (msg: ChatMessage) => void) {
  if (!supabase) return { unsubscribe: () => {} };

  const channel = supabase
    .channel(`chat-messages-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase!.removeChannel(channel);
    },
  };
}

export function subscribeToRoomUpdates(onUpdate: () => void) {
  if (!supabase) return { unsubscribe: () => {} };

  const channel = supabase
    .channel('chat-rooms-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_rooms' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      () => onUpdate()
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase!.removeChannel(channel);
    },
  };
}
