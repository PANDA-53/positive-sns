"use client"

import { reportPost } from '@/app/actions'
import { toast } from 'sonner'
import { useState } from 'react'

export function ReportButton({ postId }: { postId: number }) {
  const [isPending, setIsPending] = useState(false)

  const handleReport = async () => {
    // ユーザーに確認を促す（マイルドな表現）
    const ok = window.confirm("この投稿を見て、少し悲しい気持ちになりましたか？\nケアロボットが内容を再確認します。")
    if (!ok) return

    setIsPending(true)
    try {
      const result = await reportPost(postId)
      
      if (result.success) {
        toast.success("教えてくれてありがとうございます。私たちが内容を再確認しますね。", {
        })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("通信エラーが発生しました")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button 
      onClick={handleReport}
      disabled={isPending}
      className="flex items-center gap-1 px-2 py-1 rounded-full text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className="w-3.5 h-3.5"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
        />
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-wider">
        {isPending ? "確認中" : "少し悲しくなった"}
      </span>
    </button>
  )
}