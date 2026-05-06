"use client";

import { useState } from 'react';
import { toast } from 'sonner';

// 先ほど生成したPublicKeyをここに貼ります
const VAPID_PUBLIC_KEY = "あなたのPUBLIC_KEYをここに貼り付け";

export default function NotificationSetter({ userId }: { userId: string }) {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribe = async () => {
    setIsSubscribing(true);
    try {
      // 1. Service Workerの登録確認
      const registration = await navigator.serviceWorker.ready;

      // 2. プッシュ通知の購読
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      // 3. この subscription 情報をSupabaseに保存する（後でアクションを作ります）
      // console.log(JSON.stringify(subscription)); 
      
      toast.success("通知が有効になりました！");
    } catch (error) {
      console.error(error);
      toast.error("通知の設定に失敗しました。ホーム画面から起動しているか確認してください。");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <button
      onClick={subscribe}
      disabled={isSubscribing}
      className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
    >
      {isSubscribing ? "設定中..." : "通知を有効にする"}
    </button>
  );
}