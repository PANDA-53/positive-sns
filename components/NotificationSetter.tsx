"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updatePushSubscription } from '@/app/actions';
import { useRouter } from 'next/navigation';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "あなたのPUBLIC_KEY";

// 引数に initialSubscription (DBから取得した値) を追加
export default function NotificationSetter({ userId, initialSubscription }: { userId: string, initialSubscription: any }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  // 初期値として、DBにデータがあれば true にする
  const [isSubscribed, setIsSubscribed] = useState(!!initialSubscription);
  const router = useRouter();

  useEffect(() => {
    async function checkDeviceSubscription() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        // ブラウザ側に購読情報があれば、表示をONにする
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
      router.refresh(); // サーバー側の状態と同期
    } catch (error) {
      console.error(error);
      toast.error("設定に失敗しました");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-gray-800">プッシュ通知</h3>
        <p className="text-[10px] text-gray-400">リアクションや返信をリアルタイムでお知らせ</p>
      </div>
      
      <button
        onClick={subscribe}
        disabled={isSubscribing || isSubscribed}
        className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${
          isSubscribed 
            ? 'bg-gray-100 text-gray-400 cursor-default' 
            : 'bg-green-500 text-white shadow-md active:scale-95'
        }`}
      >
        {isSubscribing ? "SETTING UP..." : isSubscribed ? "ENABLED" : "ENABLE"}
      </button>
    </div>
  );
}