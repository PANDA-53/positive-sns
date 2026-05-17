"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updatePushSubscription } from '@/app/actions';
import { useRouter } from 'next/navigation';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "あなたのPUBLIC_KEY";

export default function NotificationSetter({ userId, initialSubscription }: { userId: string, initialSubscription: any }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(!!initialSubscription);
  const router = useRouter();

  useEffect(() => {
    async function checkDeviceSubscription() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
        }
      }
    }
    checkDeviceSubscription();
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsSubscribing(true);
    try {
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      await updatePushSubscription(JSON.stringify(subscription));
      
      setIsSubscribed(true);
      toast.success("通知を有効にしました");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("設定に失敗しました");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    /* 💡 修正箇所：外枠のカードを他ページ同様の rounded-[1.5rem] と dark:bg-zinc-900 / dark:border-zinc-800 に統一 */
    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
      <div>
        {/* 💡 修正箇所：テキストカラーをダークモード時に白ベース（zinc-100 / zinc-500）へ */}
        <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">プッシュ通知</h3>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">リアクションや返信をリアルタイムでお知らせ</p>
      </div>
      
      {/* 💡 修正箇所：ボタンのスタイルを他の機能（FriendButton等）と統一。ENABLED 時はシブい緑トーンへ */}
      <button
        onClick={subscribe}
        disabled={isSubscribing || isSubscribed}
        className={`px-4 py-2 rounded-full text-[10px] font-black transition-all border border-transparent min-w-[90px] text-center ${
          isSubscribing
            ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed' :
          isSubscribed 
            ? 'bg-green-100 text-green-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 cursor-default' 
            : 'bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95'
        }`}
      >
        {isSubscribing ? "SETTING UP..." : isSubscribed ? "ENABLED" : "ENABLE"}
      </button>
    </div>
  );
}