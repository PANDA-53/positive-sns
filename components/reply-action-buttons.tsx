'use client';

import { useState } from 'react';
import { toast } from 'sonner';
// 既存のアイコンコンポーネントを親投稿のボタンと同じ場所からインポート
import { AwesomeIcon } from './icons'; 
import { handleReaction, reportReply } from '@/app/actions'; 
import { AlertTriangle } from 'lucide-react'; // 通報用にLucideから1つ追加（不要ならテキストでもOKです）

type Props = {
  replyId: number;
  awesomeCount: number;
  initialIsAwesome: boolean;
  isMyComment: boolean;
};

export function ReplyActionButtons({ replyId, awesomeCount, initialIsAwesome, isMyComment }: Props) {
  const [isAwesome, setIsAwesome] = useState<boolean>(initialIsAwesome);
  const [count, setCount] = useState<number>(awesomeCount || 0);
  const [isReported, setIsReported] = useState<boolean>(false);

  const onClickAwesome = async () => {
    const nextState = !isAwesome;
    setIsAwesome(nextState);
    setCount(prev => nextState ? prev + 1 : prev - 1);

    try {
      await handleReaction(replyId, 'awesome');
    } catch (error) {
      setIsAwesome(isAwesome);
      setCount(count);
      toast.error('処理に失敗しました');
    }
  };

  const onClickReport = async () => {
    if (!window.confirm('このコメントに悪意を感じますか？\n不適切な表現がある場合、確認の上対処いたします。')) return;

    setIsReported(true);

    try {
      const res = await reportReply(replyId);
      if (res.success) {
        toast.success('報告を受け付けました。ご協力ありがとうございます。');
      } else {
        setIsReported(false);
        toast.error(res.message || '処理に失敗しました');
      }
    } catch (error) {
      setIsReported(false);
      toast.error('エラーが発生しました');
    }
  };

  return (
    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100/40">
      {/* 左：肯定（Awesome）ボタン（デザインを親投稿と完全統一） */}
      <button
        onClick={onClickAwesome}
        className={`flex items-center gap-1.5 group transition-colors ${
          isAwesome ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        <AwesomeIcon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
          isAwesome ? 'fill-blue-100' : 'fill-none'
        }`} />
        <span className="text-[10px] font-bold">{count} Awesome</span>
      </button>

      {/* 右：通報ボタン（控えめなグレーで世界観を邪魔しないデザイン） */}
      {!isMyComment && (
        <button 
          onClick={onClickReport}
          disabled={isReported}
          className={`flex items-center gap-1 text-[9px] font-bold transition-all active:scale-95 ${
            isReported ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-rose-400'
          }`}
        >
          <AlertTriangle size={11} strokeWidth={2.5} />
          <span>{isReported ? '報告済み' : '報告する'}</span>
        </button>
      )}
    </div>
  );
}
export default ReplyActionButtons;