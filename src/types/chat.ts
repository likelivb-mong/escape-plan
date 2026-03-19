export interface ChatUser {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'crew';
  branchCode?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | '1on1';
  avatar_color: string;
  created_at: string;
  updated_at: string;
  // Computed client-side
  memberCount?: number;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface ChatMember {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'manager' | 'crew';
  branch_code?: string;
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  read_by: string[];
  created_at: string;
}
