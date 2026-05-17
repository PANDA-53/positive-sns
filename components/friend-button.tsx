'use client';

import { useState, useEffect } from 'react';
import { sendFriendRequest, deleteFriendship } from '../app/actions';

type Props = {
  targetUserId: string;
  initialStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | undefined;
  onStatusChange?: () => void;
};

export function FriendButton({ targetUserId, initialStatus, onStatusChange }: Props) {
  const [status, setStatus] = useState(initialStatus);
  // 💡 処理中かどうかを管理するステートを追加
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleRequest = async () => {
    if (isPending) return; // 連打防止

    if (status === 'none') {
      setIsPending(true); // 💡 処理開始
      try {
        await sendFriendRequest(targetUserId);
        setStatus('pending_sent'); // 画面上のステータスを即座に更新
        if (onStatusChange) onStatusChange(); // 親（ユーザーページ）のデータも再取得
      } catch (error) {
        console.error("フレンド申請失敗:", error);
        alert("申請に失敗しました。もう一度お試しください。");
      } finally {
        setIsPending(false); // 💡 処理終了
      }
    } else if (status === 'pending_sent' || status === 'pending_received' || status === 'accepted') {
      if (confirm('友達（または申請）を解除しますか？')) {
        setIsPending(true); // 💡 処理開始
        try {
          await deleteFriendship(targetUserId);
          setStatus('none'); // 画面上のステータスを即座に更新
          if (onStatusChange) onStatusChange(); // 親（ユーザーページ）のデータも再取得
        } catch (error) {
          console.error("フレンド解除失敗:", error);
          alert("解除に失敗しました。もう一度お試しください。");
        } finally {
          setIsPending(false); // 💡 処理終了
        }
      }
    }
  };

  // 💡 ボタン内の文字を状態によって出し分ける
  const getButtonText = () => {
    if (isPending) {
      return '処理中...';
    }
    switch (status) {
      case 'accepted': return '友達';
      case 'pending_sent': return '申請中';
      case 'pending_received': return '承認待ち';
      default: return '＋ 友達になる';
    }
  };

  return (
    <button
      onClick={handleRequest}
      disabled={isPending} // 💡 処理中はボタンを押せなくする
      className={`text-[10px] px-4 py-2 rounded-full font-bold transition-all border border-transparent flex items-center justify-center min-w-[90px] ${
        isPending 
          ? 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed' :
        status === 'accepted' 
          ? 'bg-green-100 text-green-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 active:scale-95' :
        (status === 'pending_sent' || status === 'pending_received') 
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 active:scale-95' :
          'bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95'
      }`}
    >
      <span>{getButtonText()}</span>
    </button>
  );
}