// 직급 체계: 크루 < 크루장 < 마스터 관리자 / 지점별 관리자
export type ChatRole =
  | 'crew'          // 크루
  | 'crew-leader'   // 크루장
  | 'master-admin'  // 마스터 관리자 (본사)
  | 'gdxc-admin'    // GDXC-관리자
  | 'gdxr-admin'    // GDXR-관리자
  | 'nwxc-admin'    // NWXC-관리자
  | 'gnxc-admin'    // GNXC-관리자
  | 'swxc-admin';   // SWXC-관리자

/** 관리자 직급 여부 (모든 지점 채팅방 접근 가능) */
export function isAdminRole(role: ChatRole): boolean {
  return role !== 'crew' && role !== 'crew-leader';
}

/** 역할 표시 이름 */
export const ROLE_LABELS: Record<ChatRole, string> = {
  'crew': '크루',
  'crew-leader': '크루장',
  'master-admin': '마스터 관리자',
  'gdxc-admin': 'GDXC-관리자',
  'gdxr-admin': 'GDXR-관리자',
  'nwxc-admin': 'NWXC-관리자',
  'gnxc-admin': 'GNXC-관리자',
  'swxc-admin': 'SWXC-관리자',
};

/** 지점별 관리자 역할에서 지점코드 추출 */
export function getBranchCodeFromAdminRole(role: ChatRole): string | null {
  const map: Partial<Record<ChatRole, string>> = {
    'gdxc-admin': 'GDXC',
    'gdxr-admin': 'GDXR',
    'nwxc-admin': 'NWXC',
    'gnxc-admin': 'GNXC',
    'swxc-admin': 'SWXC',
  };
  return map[role] ?? null;
}

export interface ChatUser {
  id: string;
  name: string;
  role: ChatRole;
  branchCode?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | '1on1';
  avatar_color: string;
  branch_code?: string;
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
  user_role: ChatRole;
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

// 시스템 메시지 sender_id 상수
export const SYSTEM_SENDER_ID = 'system';

// 출근 상태 (localStorage 저장)
export interface WorkStatus {
  userId: string;
  branchCode: string;
  branchRoomId: string;
}
