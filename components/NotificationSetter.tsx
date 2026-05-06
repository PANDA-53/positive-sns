"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { updatePushSubscription } from '@/app/actions'; // 前に作ったアクション

// 環境変数が設定されている場合はそれを使い、なければ直接貼り付けた値を使います
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BJEoIlcIMB4uXEChjfcDjdzdu2wNrVgklCvK2Qyjbulq0FBoM9IFcOPaI3gsv_ZEdAgnngCVICjIqO5baG0ZIvs";

export default function NotificationSetter({ userId }: { userId: string }) {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribe = async () => {
    // ブラウザがサービスワーカーに対応しているかチェック
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("お使いのブラウザはプッシュ通知に対応していません。");
      return;
    }

    setIsSubscribing(true);
    try {
      // 1. Service Workerを明示的に登録（/public/sw.js が存在することを確認してください）
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 2. 準備ができるのを待つ（タイムアウト付きにしたい場合はここを調整）
      const readyRegistration = await navigator.serviceWorker.ready;

      // 3. プッシュ通知の購読
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      // 4. Supabaseへの保存
      await updatePushSubscription(JSON.stringify(subscription));
      
      toast.success("通知が有効になりました！");
    } catch (error: any) {
      console.error("Subscription Error:", error);
      // ユーザーが通知を拒否した場合などのエラーハンドリング
      if (Notification.permission === 'denied') {
        toast.error("通知が拒否されています。ブラウザの設定から許可してください。");
      } else {
        toast.error("通知設定中にエラーが発生しました。");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

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