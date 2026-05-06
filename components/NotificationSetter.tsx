"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updatePushSubscription } from '@/app/actions';

// 環境変数を優先
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "ここに生成したPUBLIC_KEYを貼る";

export default function NotificationSetter({ userId }: { userId: string }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false); // 購読済み状態を管理

  // 1. ページ読み込み時に、このブラウザですでに通知が有効かチェックする
  useEffect(() => {
    async function checkSubscription() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        // すでにサブスクリプションが存在すれば、ボタンを「設定済み」にする
        if (subscription) {
          setIsSubscribed(true);
        }
      }
    }
    checkSubscription();
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("お使いのブラウザはプッシュ通知に対応していません。");
      return;
    }

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const readyRegistration = await navigator.serviceWorker.ready;

      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      await updatePushSubscription(JSON.stringify(subscription));
      
      setIsSubscribed(true); // 状態を更新
      toast.success("通知が有効になりました！");
    } catch (error: any) {
      console.error("Subscription Error:", error);
      if (Notification.permission === 'denied') {
        toast.error("通知が拒否されています。ブラウザの設定から許可してください。");
      } else {
        toast.error("通知設定中にエラーが発生しました。");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // すでに設定済みの場合は、別のデザインやテキストを表示する
  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-[10px] font-bold text-gray-500">通知は有効です</span>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={isSubscribing}
      className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${
        isSubscribing ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
    >
      {isSubscribing ? "SETTING UP..." : "通知を有効にする"}
    </button>
  );
}