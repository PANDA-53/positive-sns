'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
// 💡 AwesomeIconに加えて、HugIcon（ハート等）も同じ場所からインポート
import { AwesomeIcon, HugIcon } from './icons'; 
import { handleReaction } from '@/app/actions'; 

type Props = {
  replyId: number;
  awesomeCount: number;
  hugCount: number;                    // 💡 親から受け取る型を追加
  initialMyReaction: 'awesome' | 'hug' | null; // 💡 リアクション状態の型を変更
  isMyComment: boolean;
};

export function ReplyActionButtons({ 
  replyId, 
  awesomeCount, 
  hugCount, 
  initialMyReaction, 
  isMyComment 
}: Props) {
  // リアクションの選択状態を管理 ('awesome' | 'hug' | null)
  const [myReaction, setMyReaction] = useState<'awesome' | 'hug' | null>(initialMyReaction);
  
  // それぞれのカウントを個別に管理
  const [awesomeCountState, setAwesomeCountState] = useState<number>(awesomeCount || 0);
  const [hugCountState, setHugCountState] = useState<number>(hugCount || 0);

  // 親コンポーネントからの初期値変更に同期
  useEffect(() => {
    setMyReaction(initialMyReaction);
    setAwesomeCountState(awesomeCount || 0);
    setHugCountState(hugCount || 0);
  }, [initialMyReaction, awesomeCount, hugCount]);

  // リアクションクリック時の共通ハンドラ
  const handleReactionClick = async (type: 'awesome' | 'hug') => {
    // 自分の投稿にはリアクションできない制限がある場合はここで弾く（不要なら削除してください）
    if (isMyComment) {
      toast.error('自分のコメントにはリアクションできません');
      return;
    }

    // 現在の状態をバックアップ（エラー時のロールバック用）
    const previousReaction = myReaction;
    const previousAwesomeCount = awesomeCountState;
    const previousHugCount = hugCountState;

    // 楽観的UIアップデート（サーバーの応答を待たずに画面を切り替える）
    if (myReaction === type) {
      // すでに選択されているものを解除
      setMyReaction(null);
      if (type === 'awesome') setAwesomeCountState(prev => Math.max(0, prev - 1));
      if (type === 'hug') setHugCountState(prev => Math.max(0, prev - 1));
    } else {
      // 別のリアクションが選択されていたらそれをマイナス
      if (myReaction === 'awesome') setAwesomeCountState(prev => Math.max(0, prev - 1));
      if (myReaction === 'hug') setHugCountState(prev => Math.max(0, prev - 1));

      // 新しいリアクションをプラス
      setMyReaction(type);
      if (type === 'awesome') setAwesomeCountState(prev => prev + 1);
      if (type === 'hug') setHugCountState(prev => prev + 1);
    }

    try {
      // サーバーアクションの呼び出し
      await handleReaction(replyId, type);
    } catch (error) {
      // エラー時は元の状態にロールバック
      setMyReaction(previousReaction);
      setAwesomeCountState(previousAwesomeCount);
      setHugCountState(previousHugCount);
      toast.error('処理に失敗しました');
    }
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      {/* 👍 Awesome ボタン */}
      <button
        onClick={() => handleReactionClick('awesome')}
        disabled={isMyComment} // 自分の投稿にリアクションさせない場合は有効化
        className={`flex items-center gap-1.5 group transition-colors disabled:opacity-80 ${
          myReaction === 'awesome' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'
        }`}
      >
        <AwesomeIcon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
          myReaction === 'awesome' ? 'fill-blue-100 dark:fill-blue-950' : 'fill-none'
        }`} />
        <span className="text-[10px] font-bold">{awesomeCountState} Awesome</span>
      </button>

      {/* ❤️ Hug ボタン */}
      <button
        onClick={() => handleReactionClick('hug')}
        disabled={isMyComment}
        className={`flex items-center gap-1.5 group transition-colors disabled:opacity-80 ${
          myReaction === 'hug' ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 dark:text-zinc-500'
        }`}
      >
        <HugIcon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
          myReaction === 'hug' ? 'fill-rose-100 dark:fill-rose-950' : 'fill-none'
        }`} />
        <span className="text-[10px] font-bold">{hugCountState} Hug</span>
      </button>
    </div>
  );
}

export default ReplyActionButtons;