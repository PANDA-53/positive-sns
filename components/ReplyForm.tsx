"use client"

import { useState, useTransition } from 'react'
import { createReply } from '@/app/actions'
import { toast } from 'sonner'
import Image from 'next/image'

export default function ReplyForm({ parentId }: { parentId: string }) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorData, setErrorData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result: any = await createReply(formData)
      
      // AIが「有害」と判定した場合
      if (result && result.isToxic) {
        // ここでエラーデータをセットすることで、言い換え案（suggestions）が表示されるようになります
        setErrorData(result)
        
        // トースト（ロボット）だけを出さないようにしています
        console.log("Toxic content detected, showing suggestions only.");
      } else {
        // 成功時
        setContent('')
        setErrorData(null)
        toast.success("送信完了")
      }
    })
  }

  const handleClear = () => {
    setContent('')
    setErrorData(null)
    toast.dismiss()
  }

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText)
    setErrorData(null)
    // 別の候補を選び直せるよう、一度クリアした後に送信待ち状態にするなどの処理は不要です
  }

  return (
    <div className="mt-4">
      {/* 言い換え案チップ：errorDataがあるときだけ表示 */}
      {errorData?.suggestions && errorData.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-2 animate-in fade-in slide-in-from-bottom-2">
          {errorData.suggestions.map((text: string, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(text)}
              className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full hover:bg-green-100 transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className={`flex items-center gap-2 p-2 rounded-full border transition-all duration-500 ${
          errorData ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-gray-50 border-gray-100'
        }`}
      >
        <input type="hidden" name="parentId" value={parentId} />
        <input 
          name="content" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={errorData ? "変換しましょう..." : "返信する..."}
          autoComplete="off"
          className="flex-1 bg-transparent px-4 py-2 text-base outline-none text-black placeholder-gray-400" 
          required 
        />
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-black text-white text-xs font-bold px-5 py-2 rounded-full disabled:bg-gray-300"
        >
          {isPending ? "確認中" : "返信"}
        </button>
      </form>

      {(content.length > 0 || errorData) && (
        <div className="flex justify-between items-center mt-2 px-4 animate-in fade-in">
          <p className="text-[10px] font-bold text-amber-600 italic">
            {errorData ? "あなたの好きな投稿に目を向けてはいかがですか" : ""}
          </p>
          <button 
            type="button" 
            onClick={handleClear} 
            className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
          >
            CLEAR
          </button>
        </div>
      )}
    </div>
  )
}