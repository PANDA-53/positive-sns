'use client';

import { AwesomeIcon, HugIcon } from './icons';
import { handleReaction } from '../app/actions';
import { useState } from 'react';
import { toast } from 'sonner'; // トースト通知で優しく伝える用

type Props = {
  postId: number;
  awesomeCount: number;
  hugCount: number;
  initialMyReaction: 'awesome' | 'hug' | null;
  isOwnPost?: boolean; 
};

export function ReactionButtons({ 
  postId, 
  awesomeCount, 
  hugCount, 
  initialMyReaction,
  isOwnPost = false 
}: Props) {
  const [myReaction, setMyReaction] = useState<'awesome' | 'hug' | null>(initialMyReaction);
  const [counts, setCounts] = useState({ awesome: awesomeCount, hug: hugCount });

  const onClickReaction = async (type: 'awesome' | 'hug') => {
    if (isOwnPost) {
      toast.error('自分の投稿へのリアクションはできません');
      return;
    }

    // 楽観的アップデート（サーバーの返答を待たずに見た目を変える）
    let newCounts = { ...counts };
    let newMyReaction = null;

    if (myReaction === type) {
      newCounts[type]--;
      newMyReaction = null;
    } else {
      if (myReaction) {
        newCounts[myReaction]--; 
      }
      newCounts[type]++;
      newMyReaction = type;
    }

    setMyReaction(newMyReaction);
    setCounts(newCounts);

    await handleReaction(postId, type);
  };

  return (
    /* 🛠️ 内包されていた mt-4 pt-4 border-t を完全に撤去し、フラットな横並び要素に修正 */
    <div className="flex items-center gap-6">
      {/* Awesome Button */}
      <button
        onClick={() => onClickReaction('awesome')}
        disabled={isOwnPost} 
        className={`flex items-center gap-2 group transition-colors ${
          isOwnPost ? 'opacity-50 cursor-not-allowed' : '' 
        } ${
          myReaction === 'awesome' ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        <AwesomeIcon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
          myReaction === 'awesome' ? 'fill-blue-100' : 'fill-none'
        }`} />
        <span className="text-xs font-bold">{counts.awesome} Awesome</span>
      </button>

      {/* Hug Button */}
      <button
        onClick={() => onClickReaction('hug')}
        disabled={isOwnPost} 
        className={`flex items-center gap-2 group transition-colors ${
          isOwnPost ? 'opacity-50 cursor-not-allowed' : '' 
        } ${
          myReaction === 'hug' ? 'text-pink-600' : 'text-gray-400'
        }`}
      >
        <HugIcon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
          myReaction === 'hug' ? 'fill-pink-100' : 'fill-none'
        }`} />
        <span className="text-xs font-bold">{counts.hug} Hug</span>
      </button>
    </div>
  );
}