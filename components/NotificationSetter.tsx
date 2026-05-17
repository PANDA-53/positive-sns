"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updatePushSubscription } from '@/app/actions';
import { useRouter } from 'next/navigation';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// 💡 鍵変換用のヘルパー関数
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID Public Key が設定されていません");
      return;
    }

    setIsSubscribing(true);
    try {
      // 1. 通知のパーミッション確認
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("通知の許可が拒否されました。設定から変更してください。");
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      // 💡 2. 鍵を Uint8Array に変換して安全にサブスクライブ
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 💡 3. 先ほど新しくした Server Actions の引数の型（userId, JSONオブジェクト）に合わせて呼び出し
      await updatePushSubscription(userId, subscription.toJSON());
      
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
    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">プッシュ通知</h3>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">リアクションや返信をリアルタイムでお知らせ</p>
      </div>
      
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