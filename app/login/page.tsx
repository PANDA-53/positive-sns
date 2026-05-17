"use client";

import { useState, Suspense } from 'react';
import { login, signup } from '../actions';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';

const GOLD_COLOR = "#B8860B";

// 送信ボタン専用のコンポーネント
function SubmitButton({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
        pending 
          ? 'bg-gray-400 dark:bg-zinc-700 cursor-not-allowed' 
          : 'text-white'
      }`}
      style={!pending ? { backgroundColor: GOLD_COLOR } : {}}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-ping h-2 w-2 rounded-full bg-white"></span>
          Processing...
        </span>
      ) : (
        isLogin ? 'Login' : 'Create Account'
      )}
    </button>
  );
}

function LoginFormInner() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  return (
    <div className="space-y-6">
      {/* 切り替えタブ：他の画面のフィルタボタンと同じスタイル */}
      {/* 💡 修正箇所1: 切り替えタブの背景とボーダーをダーク対応 */}
      <div className="flex bg-[#F9F6E5] dark:bg-zinc-950 rounded-full p-1 border border-[#B8860B]/10 dark:border-zinc-800 transition-colors duration-200">
        <button 
          onClick={() => setIsLogin(true)}
          /* 💡 修正箇所2: アクティブ/非アクティブ時の背景とテキスト色をダーク対応 */
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
            isLogin ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-gray-400 dark:text-zinc-500'
          }`}
          style={isLogin ? { color: GOLD_COLOR } : {}}
        >
          Login
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
            !isLogin ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-gray-400 dark:text-zinc-500'
          }`}
          style={!isLogin ? { color: GOLD_COLOR } : {}}
        >
          Sign Up
        </button>
      </div>

      {/* 💡 修正箇所3: エラー・成功メッセージの背景とテキスト色をダーク対応 */}
      {error && (
        <p className="text-rose-500 dark:text-rose-400 text-[10px] font-bold text-center bg-rose-50 dark:bg-rose-950/30 border dark:border-rose-900/30 py-3 rounded-xl animate-in fade-in slide-in-from-top-1">
          認証に失敗しました。内容を確認してください。
        </p>
      )}
      {message === 'success' && (
        <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold text-center bg-emerald-50 dark:bg-emerald-950/30 border dark:border-emerald-900/30 py-3 rounded-xl">
          登録完了！ログインしてください。
        </p>
      )}

      <form action={isLogin ? login : signup} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>Email</label>
            {/* 💡 修正箇所4: インプットの背景・ボーダー・文字色をダーク対応 */}
            <input 
              name="email" 
              type="email" 
              placeholder="example@positives.com" 
              inputMode="email" 
              autoComplete="email"
              className="w-full p-4 bg-[#FDFCF9] dark:bg-zinc-950 rounded-2xl outline-none text-black dark:text-zinc-100 border border-[#E2DED0]/50 dark:border-zinc-800 focus:ring-2 focus:ring-[#B8860B]/10 dark:focus:ring-[#B8860B]/20 transition-all text-sm font-bold shadow-inner" 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>Password</label>
            {/* 💡 修正箇所5: パスワードインプットも同様にダーク対応 */}
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full p-4 bg-[#FDFCF9] dark:bg-zinc-950 rounded-2xl outline-none text-black dark:text-zinc-100 border border-[#E2DED0]/50 dark:border-zinc-800 focus:ring-2 focus:ring-[#B8860B]/10 dark:focus:ring-[#B8860B]/20 transition-all text-sm font-bold shadow-inner" 
              required 
            />
          </div>
        </div>
        
        <div className="pt-4">
          <SubmitButton isLogin={isLogin} />
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    /* 💡 修正箇所6: 全体背景を dark:bg-zinc-950、ベースの文字色を dark:text-zinc-100 に変更 */
    <main className="min-h-screen flex flex-col items-center bg-[#F2F2F2] dark:bg-zinc-950 p-6 pt-24 font-sans text-black dark:text-zinc-100 transition-colors duration-200">
      {/* メインカード：プロフィール編集画面と統一 */}
      {/* 💡 修正箇所7: 中央のカードコンテナを dark:bg-zinc-900 / dark:border-zinc-800 に */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2DED0] dark:border-zinc-800 w-full max-w-md transition-colors duration-200">
        <div className="mb-10 text-center">
           <h1 className="text-3xl font-black tracking-tighter" style={{ color: GOLD_COLOR }}>POSITIVES</h1>
           <div className="flex items-center justify-center gap-2 mt-2">
             {/* 💡 修正箇所8: タイトル横の線の色をダーク対応 */}
             <div className="h-[1px] w-4 bg-gray-200 dark:bg-zinc-800"></div>
             <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Welcome Back</p>
             <div className="h-[1px] w-4 bg-gray-200 dark:bg-zinc-800"></div>
           </div>
        </div>

        <div>
          <Suspense fallback={
            <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: GOLD_COLOR }}>
              Loading...
            </div>
          }>
            <LoginFormInner />
          </Suspense>
        </div>
      </div>

      {/* フッター的なテキスト */}
      {/* 💡 修正箇所9: コピーライトテキストのカラーをダーク時に調整 */}
      <p className="mt-8 text-[10px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
        © 2026 Positives SNS
      </p>
    </main>
  );
}