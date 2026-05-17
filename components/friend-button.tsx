'use client';

import { useState, useEffect } from 'react';
import { sendFriendRequest, deleteFriendship } from '../app/actions';

// 💡 修正箇所：actions.tsの戻り値の型と完全に一致させ、onStatusChangeを追加
type Props = {
  targetUserId: string;
  initialStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | undefined;
  onStatusChange?: () => void;
};

export function FriendButton({ targetUserId, initialStatus, onStatusChange }: Props) {
  const [status, setStatus] = useState(initialStatus);

  // 💡 修正箇所：親コンポーネント（page.tsx）側で再検証（refetch）された最新のステータスを同期する
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleRequest = async () => {
    if (status === 'none') {
      setStatus('pending_sent');
      await sendFriendRequest(targetUserId);
      if (onStatusChange) onStatusChange(); // 親のデータを更新
    } else if (status === 'pending_sent' || status === 'pending_received' || status === 'accepted') {
      if (confirm('友達（または申請）を解除しますか？')) {
        setStatus('none');
        await deleteFriendship(targetUserId);
        if (onStatusChange) onStatusChange(); // 親のデータを更新
      }
    }
  };

  return (
    <button
      onClick={handleRequest}
      className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all active:scale-95 border border-transparent ${
        status === 'accepted' 
          ? 'bg-green-100 text-green-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50' :
        (status === 'pending_sent' || status === 'pending_received') 
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' :
          'bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
      }`}
    >
      {status === 'accepted' ? '友達' :
       status === 'pending_sent' ? '申請中' :
       status === 'pending_received' ? '承認待ち' :
       '＋ 友達になる'}
    </button>
  );
}