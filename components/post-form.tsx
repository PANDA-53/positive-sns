"use client"

import { useState } from 'react'
import { createPost } from '@/app/actions' // パスは環境に合わせて調整してください
import imageCompression from 'browser-image-compression'

export default function PostForm() {
  const [isCompressing, setIsCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCompressing(true)

    try {
      const formData = new FormData(e.currentTarget)
      const imageFile = formData.get('image') as File

      // 1MBを超えていたら圧縮
      if (imageFile && imageFile.size > 1024 * 1024) {
        const options = {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(imageFile, options)
        formData.set('image', compressedFile, compressedFile.name)
      }

      await createPost(formData)
      
      // 送信成功時にリセット
      e.currentTarget.reset()
      setPreviewUrl(null)
    } catch (error) {
      console.error('投稿エラー:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100">
      <textarea 
        name="content" 
        placeholder="最近あった、いいことは？" 
        className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border-none resize-none" 
        rows={3} 
        required 
      />
      
      {/* プレビュー表示 */}
      {previewUrl && (
        <div className="relative mt-4 rounded-2xl overflow-hidden border border-gray-100">
          <img src={previewUrl} alt="Preview" className="w-full h-auto" />
          <button 
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <label className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <input type="file" name="image" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        <button 
          type="submit" 
          disabled={isCompressing}
          className="bg-black text-white font-bold py-3 px-8 rounded-2xl shadow-lg disabled:bg-gray-400 transition-all"
        >
          {isCompressing ? "送信中..." : "投稿をシェア"}
        </button>
      </div>
    </form>
  )
}