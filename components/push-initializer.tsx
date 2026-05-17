'use client';

import { useEffect } from 'react';
import { updatePushSubscription } from '@/app/actions'; // 💡 後ほどActionsに作成する関数

// VAPID公開鍵を型変換するヘルパー
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

interface PushInitializerProps {
  currentUserId: string;
}

export function PushInitializer({ currentUserId }: PushInitializerProps) {
  useEffect(() => {
    // ログインしていない、またはブラウザがプッシュ通知非対応なら何もしない
    if (!currentUserId || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const initPushNotification = async () => {
      try {
        // 1. Service Worker を登録
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker 登録完了:', registration.scope);

        // 既に通知許可（granted）がある場合のみ、バックグラウンドで自動同期・更新する
        if (Notification.permission === 'granted') {
          const readyReg = await navigator.serviceWorker.ready;
          let subscription = await readyReg.pushManager.getSubscription();

          // トークンが失効している、または未購読なら再生成
          if (!subscription) {
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicKey) return;

            subscription = await readyReg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
          }

          // Server Action を呼び出して Supabase 側に最新のトークンを保存・更新
          await updatePushSubscription(currentUserId, subscription.toJSON());
        }
      } catch (error) {
        console.error('Push Initialization Error:', error);
      }
    };

    initPushNotification();
  }, [currentUserId]);

  return null; // 画面には何も描画しない
}