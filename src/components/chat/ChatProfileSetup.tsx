import { useState } from 'react';
import type { ChatRole, ChatUser } from '../../types/chat';
import { ROLE_LABELS, isAdminRole, getBranchCodeFromAdminRole } from '../../types/chat';
import { saveChatUser } from '../../services/chatService';

// 지점별 관리자 역할 (역할 선택만으로 지점 결정됨)
const BRANCH_ADMIN_ROLES: ChatRole[] = [
  'gdxc-admin', 'gdxr-admin', 'nwxc-admin', 'gnxc-admin', 'swxc-admin',
];

// 크루/크루장용 지점 선택 목록
const BRANCH_OPTIONS = [
  { code: 'GDXC', name: '엑스케이프 건대1호점' },
  { code: 'GDXR', name: '엑스크라임 건대2호점' },
  { code: 'NWXC', name: '뉴케이스 건대3호점' },
  { code: 'GNXC', name: '엑스케이프 강남점' },
  { code: 'SWXC', name: '엑스케이프 수원점' },
];

// 직급 그룹
const ROLE_GROUPS: { label: string; roles: ChatRole[] }[] = [
  { label: '근무자', roles: ['crew', 'crew-leader'] },
  { label: '관리자', roles: ['master-admin', ...BRANCH_ADMIN_ROLES] },
];

interface Props {
  onComplete: (user: ChatUser) => void;
}

export default function ChatProfileSetup({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ChatRole>('crew');
  const [branch, setBranch] = useState('');

  // 지점별 관리자 역할이면 역할에서 지점 자동 결정
  const isBranchAdmin = BRANCH_ADMIN_ROLES.includes(role);
  const isMasterAdmin = role === 'master-admin';
  const needsBranchSelect = !isAdminRole(role); // 크루/크루장만 지점 선택

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (needsBranchSelect && !branch) return;

    // 지점 코드 결정
    let branchCode: string | undefined;
    if (isBranchAdmin) {
      branchCode = getBranchCodeFromAdminRole(role) ?? undefined;
    } else if (isMasterAdmin) {
      branchCode = 'XYNP'; // 본사
    } else {
      branchCode = branch;
    }

    const user: ChatUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      branchCode,
    };
    saveChatUser(user);
    onComplete(user);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5 p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white/90">채팅 프로필 설정</h2>
          <p className="text-caption text-white/40 mt-1">근무중 소통을 위한 프로필을 설정하세요</p>
        </div>

        {/* 이름 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-medium text-white/50">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            autoFocus
            className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white text-sm outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* 직급 */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-medium text-white/50">직급</label>
          {ROLE_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <span className="text-[10px] text-white/25 font-medium tracking-wide uppercase">{group.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {group.roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setBranch(''); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      role === r
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.06]'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 지점 선택 (크루/크루장만) */}
        {needsBranchSelect && (
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-white/50">지점</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white text-sm outline-none focus:border-white/25 transition-colors"
            >
              <option value="">선택하세요</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 관리자 지점 표시 */}
        {isBranchAdmin && (
          <div className="px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            담당 지점: <span className="font-semibold">{getBranchCodeFromAdminRole(role)}</span> 자동 배정
          </div>
        )}
        {isMasterAdmin && (
          <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
            본사 관리자 — 모든 지점 채팅 접근 가능
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || (needsBranchSelect && !branch)}
          className="mt-2 px-6 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          시작하기
        </button>
      </form>
    </div>
  );
}
