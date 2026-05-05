"use client"

import { useState, useEffect, useRef } from 'react'
import { createPost } from '@/app/actions'
import imageCompression from 'browser-image-compression'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

interface PostResult {
  isToxic?: boolean;
  reason?: string;
  suggestions?: string[];
  success?: boolean;
}

export default function PostForm() {
  const [content, setContent] = useState('')
  const [isCompressing, setIsCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends'>('public')
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isToxic = searchParams.get('error') === 'toxic-content'
  const suggestionsRaw = searchParams.get('suggestions')
  const suggestions: string[] = suggestionsRaw ? JSON.parse(suggestionsRaw) : []

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText)
    router.replace('/')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 10.9) {
          toast.error("動画は10秒以内にしてください")
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(file))
        setIsVideo(true)
      }
      video.src = URL.createObjectURL(file)
    } else if (file.type.startsWith('image/')) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      setIsVideo(false)
    }
  }

  const handleCancel = () => {
    setContent('')
    setPreviewUrl(null)
    setIsVideo(false)
    setPrivacyLevel('public')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (fileInputRef.current) fileInputRef.current.value = ""
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCompressing(true)
    try {
      const formData = new FormData(e.currentTarget)
      
      if (!isVideo) {
        const imageFile = formData.get('image') as File
        if (imageFile && imageFile.size > 1024 * 1024) {
          const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1200, useWebWorker: true }
          const compressedFile = await imageCompression(imageFile, options)
          formData.set('image', compressedFile, compressedFile.name)
        }
      }

      const result = await createPost(formData) as PostResult

      if (result && result.isToxic) {
        const params = new URLSearchParams()
        params.set('error', 'toxic-content')
        params.set('reason', result.reason || '')
        if (result.suggestions) {
          params.set('suggestions', JSON.stringify(result.suggestions))
        }
        router.replace(`/?${params.toString()}`)
        return
      }

      setContent('')
      setPreviewUrl(null)
      setIsVideo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast.success('投稿をシェアしました！')
      router.replace('/') 

    } catch (error) {
      console.error('投稿エラー:', error)
      toast.error('投稿に失敗しました。')
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <div className="space-y-3">
      {isToxic && suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-100 p-4 rounded-[1.5rem] shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-black text-green-800 uppercase tracking-wider">Positive Magic</p>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(text)}
                className="text-left text-[10px] font-bold bg-white hover:bg-green-50 border border-green-100 p-3 rounded-xl transition-all active:scale-95 text-gray-700 leading-relaxed shadow-sm"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 外側のパディングを p-6 -> p-4 に、角丸を 1.5rem に凝縮 */}
      <form id="post-form" onSubmit={handleSubmit} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 transition-all">
        {/* textareaを1行(rows={1})にし、パディングとフォントサイズを微調整 */}
        <textarea 
          name="content" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="最近あった、いいことは？" 
          className={`w-full p-4 rounded-2xl outline-none text-black border-none resize-none transition-all text-sm leading-snug ${
            isToxic ? 'bg-amber-50/50 shadow-[0_0_0_2px_rgba(245,158,11,0.1)]' : 'bg-gray-50'
          }`} 
          rows={1} 
          required 
        />
        
        {previewUrl && (
          <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100 bg-black max-h-[300px] flex items-center justify-center">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-auto max-h-[300px] object-contain" controls muted />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[300px] object-contain" />
            )}
            <button 
              type="button" 
              onClick={() => {
                setPreviewUrl(null)
                setIsVideo(false)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }} 
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors hover:bg-black/70 z-10 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* 下部アクションエリアの余白を mt-6 -> mt-3 に削減 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <div className="flex items-center gap-3">
            {/* メディア選択ボタン: p-3 -> p-2 */}
            <label className="cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <input ref={fileInputRef} type="file" name={isVideo ? "video" : "image"} accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            </label>

            {/* スライド式プライバシー・スイッチ: 高さ w-20 h-10 -> w-16 h-8 */}
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setPrivacyLevel(prev => prev === 'public' ? 'friends' : 'public')}
                className="relative w-16 h-8 bg-gray-100 rounded-full p-1 cursor-pointer select-none transition-all"
              >
                <div 
                  className={`absolute top-1 bottom-1 w-6 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${
                    privacyLevel === 'public' ? 'left-1 bg-green-500' : 'left-[36px] bg-blue-500'
                  }`}
                >
                  {privacyLevel === 'public' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight w-10 transition-colors ${privacyLevel === 'public' ? 'text-green-600' : 'text-blue-600'}`}>
                {privacyLevel === 'public' ? 'Public' : 'Friends'}
              </span>
              <input type="hidden" name="privacy_level" value={privacyLevel} />
            </div>

            <button type="button" onClick={handleCancel} className="text-[9px] font-black text-gray-300 hover:text-gray-600 transition-colors uppercase tracking-widest">RESET</button>
          </div>

          <button 
            type="submit" 
            disabled={isCompressing}
            className={`w-full sm:w-auto font-black text-[10px] py-3 px-8 rounded-full shadow-md transition-all tracking-widest uppercase ${
              isToxic ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-black text-white hover:bg-gray-800 active:scale-95"
            }`}
          >
            {isCompressing ? "Sending..." : isToxic ? "Rewrite" : "Share"}
          </button>
        </div>
      </form>
    </div>
  )
}