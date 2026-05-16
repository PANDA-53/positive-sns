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
  isOwnPost?: boolean; // ★ 追加：これで親コンポーネントの赤線エラーが完全に消えます
};

export function ReactionButtons({ 
  postId, 
  awesomeCount, 
  hugCount, 
  initialMyReaction,
  isOwnPost = false // ★ 追加：初期値をfalseにして安全に受け取ります
}: Props) {
  const [myReaction, setMyReaction] = useState<'awesome' | 'hug' | null>(initialMyReaction);
  const [counts, setCounts] = useState({ awesome: awesomeCount, hug: hugCount });

  const onClickReaction = async (type: 'awesome' | 'hug') => {
    // ★ 追加：自分の投稿の場合はトーストを出して処理をガード
    if (isOwnPost) {
      toast.error('自分の投稿へのリアクションはできません');
      return;
    }

    // 楽観的アップデート（サーバーの返答を待たずに見た目を変える）
    let newCounts = { ...counts };
    let newMyReaction = null;

    if (myReaction === type) {
      // 同じリアクションを押した場合はキャンセル
      newCounts[type]--;
      newMyReaction = null;
    } else {
      // 新しいリアクションを押した場合
      if (myReaction) {
        newCounts[myReaction]--; // 前のリアクションを減らす
      }
      newCounts[type]++;
      newMyReaction = type;
    }

    setMyReaction(newMyReaction);
    setCounts(newCounts);

    // サーバー側の処理を呼び出す
    await handleReaction(postId, type);
  };

  return (
    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
      {/* Awesome Button */}
      <button
        onClick={() => onClickReaction('awesome')}
        disabled={isOwnPost} // ★ 追加：自分の投稿ならボタンを非活性化
        className={`flex items-center gap-2 group transition-colors ${
          isOwnPost ? 'opacity-50 cursor-not-allowed' : '' // ★ 追加：自分の投稿の時の見た目
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
        disabled={isOwnPost} // ★ 追加：自分の投稿ならボタンを非活性化
        className={`flex items-center gap-2 group transition-colors ${
          isOwnPost ? 'opacity-50 cursor-not-allowed' : '' // ★ 追加：自分の投稿の時の見た目
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