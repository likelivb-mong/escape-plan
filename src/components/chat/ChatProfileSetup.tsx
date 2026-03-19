import { useState } from 'react';
import type { ChatUser } from '../../types/chat';
import { saveChatUser } from '../../services/chatService';

const ROLE_OPTIONS: { value: ChatUser['role']; label: string }[] = [
  { value: 'admin', label: '관리자 (본사)' },
  { value: 'manager', label: '매니저 (지점장)' },
  { value: 'crew', label: '크루 (근무자)' },
];

const BRANCH_OPTIONS = [
  '강남점', '건대점', '신촌점', '홍대점', '수원점',
  '대구점', '부산점', '본사',
];

interface Props {
  onComplete: (user: ChatUser) => void;
}

export default function ChatProfileSetup({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ChatUser['role']>('crew');
  const [branch, setBranch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const user: ChatUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      branchCode: branch || undefined,
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

        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-medium text-white/50">직책</label>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                  role === opt.value
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-medium text-white/50">지점</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white text-sm outline-none focus:border-white/25 transition-colors"
          >
            <option value="">선택하세요</option>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-2 px-6 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          시작하기
        </button>
      </form>
    </div>
  );
}
