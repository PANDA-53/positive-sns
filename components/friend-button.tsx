'use client';

import { useState } from 'react';
import { sendFriendRequest, deleteFriendship } from '../app/actions';

type Props = {
  targetUserId: string;
  initialStatus: 'none' | 'pending' | 'accepted' | 'me';
};

export function FriendButton({ targetUserId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);

  if (status === 'me') return null; // 自分にはボタンを出さない

  const handleRequest = async () => {
    if (status === 'none') {
      setStatus('pending');
      await sendFriendRequest(targetUserId);
    } else if (status === 'pending' || status === 'accepted') {
      if (confirm('友達（または申請）を解除しますか？')) {
        setStatus('none');
        await deleteFriendship(targetUserId);
      }
    }
  };

  return (
    <button
      onClick={handleRequest}
      className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all active:scale-95 border border-transparent ${
        /* 💡 修正箇所: 各ステータスの背景色と文字色を dark: 時で最適化。目に優しいシブいトーンに変更 */
        status === 'accepted' 
          ? 'bg-green-100 text-green-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50' :
        status === 'pending' 
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' :
          'bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
      }`}
    >
      {status === 'accepted' ? '友達' :
       status === 'pending' ? '申請中' :
       '＋ 友達になる'}
    </button>
  );
}