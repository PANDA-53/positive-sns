"use client"

import { useState, useTransition } from 'react'
import { createReply } from '@/app/actions'
import { toast } from 'sonner'


export default function ReplyForm({ parentId }: { parentId: string }) {
  const [showForm, setShowForm] = useState(false) // フォームの表示フラグ
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorData, setErrorData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result: any = await createReply(formData)
      
      if (result && result.isToxic) {
        setErrorData(result)
        console.log("Toxic content detected, showing suggestions only.");
      } else {
        setContent('')
        setErrorData(null)
        setShowForm(false) // 送信成功時にフォームを閉じる
        toast.success("送信完了")
      }
    })
  }

  const handleClear = () => {
    setContent('')
    setErrorData(null)
    setShowForm(false) // クリア時にフォームを閉じる
    toast.dismiss()
  }

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText)
    setErrorData(null)
  }

  // --- フォームを表示していない時の表示 ---
  if (!showForm) {
    return (
      <button 
        onClick={() => setShowForm(true)}
        className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors px-2 py-1"
      >
        <span></span>
        コメント…
      </button>
    )
  }

  // --- フォームを表示している時の表示 ---
  return (
    <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase"></span>
        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-black">
          <span>×</span>
        </button>
      </div>

      {/* 言い換え案チップ */}
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
          placeholder={errorData ? "変換しましょう..." : "コメントする…"}
          autoComplete="off"
          autoFocus // フォームが開いた瞬間にすぐ入力できるように
          className="flex-1 bg-transparent px-4 py-2 text-base outline-none text-black placeholder-gray-400" 
          required 
        />
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-black text-white text-xs font-bold px-5 py-2 rounded-full disabled:bg-gray-300"
        >
          {isPending ? "確認中" : "送信"}
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
            CANCEL
          </button>
        </div>
      )}
    </div>
  )
}