import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, setShowAuthModal } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error);
      } else {
        setShowAuthModal(false);
      }
    } else {
      const { error } = await signUpWithEmail(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccessMsg('확인 이메일을 보냈습니다. 이메일을 확인해주세요.');
      }
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShowAuthModal(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          onClick={() => setShowAuthModal(false)}
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          클라우드 저장 및 기기 간 동기화를 위해 로그인하세요.
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 계속하기
        </button>

        <div className="relative mb-4 flex items-center">
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
          <span className="mx-3 text-xs text-zinc-400">또는</span>
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="password"
            required
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}
          {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          {' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="font-medium text-rose-500 hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
}
