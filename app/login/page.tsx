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
          ? 'bg-gray-400 cursor-not-allowed' 
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
      <div className="flex bg-[#F9F6E5] rounded-full p-1 border border-[#B8860B]/10">
        <button 
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
            isLogin ? 'bg-white shadow-sm' : 'text-gray-400'
          }`}
          style={isLogin ? { color: GOLD_COLOR } : {}}
        >
          Login
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
            !isLogin ? 'bg-white shadow-sm' : 'text-gray-400'
          }`}
          style={!isLogin ? { color: GOLD_COLOR } : {}}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-50 py-3 rounded-xl animate-in fade-in slide-in-from-top-1">
          認証に失敗しました。内容を確認してください。
        </p>
      )}
      {message === 'success' && (
        <p className="text-emerald-600 text-[10px] font-bold text-center bg-emerald-50 py-3 rounded-xl">
          登録完了！ログインしてください。
        </p>
      )}

      <form action={isLogin ? login : signup} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>Email</label>
            <input 
              name="email" 
              type="email" 
              placeholder="example@positives.com" 
              inputMode="email" 
              autoComplete="email"
              className="w-full p-4 bg-[#FDFCF9] rounded-2xl outline-none border border-[#E2DED0]/50 focus:ring-2 focus:ring-[#B8860B]/10 transition-all text-sm font-bold shadow-inner" 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full p-4 bg-[#FDFCF9] rounded-2xl outline-none border border-[#E2DED0]/50 focus:ring-2 focus:ring-[#B8860B]/10 transition-all text-sm font-bold shadow-inner" 
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
    <main className="min-h-screen flex flex-col items-center bg-[#F2F2F2] p-6 pt-24 font-sans text-black">
      {/* メインカード：プロフィール編集画面と統一 */}
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2DED0] w-full max-w-md">
        <div className="mb-10 text-center">
           <h1 className="text-3xl font-black tracking-tighter" style={{ color: GOLD_COLOR }}>POSITIVES</h1>
           <div className="flex items-center justify-center gap-2 mt-2">
             <div className="h-[1px] w-4 bg-gray-200"></div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Welcome Back</p>
             <div className="h-[1px] w-4 bg-gray-200"></div>
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
      <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        © 2026 Positives SNS
      </p>
    </main>
  );
}