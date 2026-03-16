import { useState, useEffect } from 'react';

const SESSION_KEY = 'xcape-auth';
const CORRECT = import.meta.env.VITE_APP_PASSWORD as string;

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (
      localStorage.getItem(SESSION_KEY) === 'ok' ||
      sessionStorage.getItem(SESSION_KEY) === 'ok'
    ) {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === CORRECT) {
      if (remember) {
        localStorage.setItem(SESSION_KEY, 'ok');
      } else {
        sessionStorage.setItem(SESSION_KEY, 'ok');
      }
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1500);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
        <div className="text-2xl font-bold text-white/80 tracking-tight">🔐 XCAPE</div>
        <p className="text-sm text-white/30">비밀번호를 입력하세요</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="••••••••"
          className={`w-56 px-4 py-2.5 rounded-lg bg-white/[0.06] border text-white text-center text-sm tracking-widest outline-none transition-all ${
            error
              ? 'border-red-500/60 bg-red-500/10 animate-shake'
              : 'border-white/[0.10] focus:border-white/25'
          }`}
        />
        {error && <p className="text-xs text-red-400/70 -mt-2">비밀번호가 틀렸습니다</p>}
        <label className="flex items-center gap-2 cursor-pointer -mt-1">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-white/60"
          />
          <span className="text-xs text-white/30">자동 로그인</span>
        </label>
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          입장
        </button>
      </form>
    </div>
  );
}
