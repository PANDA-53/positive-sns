"use client"

import { useState } from 'react'
import { updateProfile } from '../actions'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ProfileEditForm({ initialProfile }: { initialProfile: any }) {
  const [previewUrl, setPreviewUrl] = useState(initialProfile?.avatar_url)
  const [isCompressing, setIsCompressing] = useState(false)
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
  const router = useRouter()

  // 遷移先のパス
  const userPagePath = `/users/${initialProfile?.id}`

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isCompressing) return
    setIsCompressing(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      // 画像圧縮
      const imageFile = formData.get('avatar') as File
      if (imageFile && imageFile.size > 1024 * 1024) {
        const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1200, useWebWorker: true }
        const compressedFile = await imageCompression(imageFile, options)
        formData.set('avatar', compressedFile, compressedFile.name)
      }

      // サーバーアクション実行（awaitする）
      await updateProfile(formData)

      // 成功時（サーバー側でリダイレクトがない場合）
      toast.success('プロフィールを更新しました')
      router.refresh()
      router.push(userPagePath)

    } catch (error: any) {
      // サーバー側で redirect("/") が走ると、ここ（catch）に NEXT_REDIRECT エラーが来ます
      // その場合でも、無視してユーザーページへ強制移動させます
      router.refresh()
      window.location.href = userPagePath 
    } finally {
      // 念のための保険
      setTimeout(() => setIsCompressing(false), 1000)
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-black pb-12 font-sans pt-6">
      <div className="max-w-2xl mx-auto px-4">
        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-md bg-gray-100">
                <img 
                  src={previewUrl || defaultAvatar} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                />
              </div>
              <label className="cursor-pointer bg-gray-50 text-gray-600 px-6 py-2 rounded-full text-[10px] font-black border border-gray-200 hover:bg-gray-100 transition-all uppercase tracking-widest active:scale-95">
                {isCompressing ? "最適化中..." : "写真を変更"}
                <input 
                  name="avatar" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                  disabled={isCompressing}
                />
              </label>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">User Name</label>
                <input 
                  name="fullName" 
                  type="text" 
                  defaultValue={initialProfile?.full_name || ''} 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-bold" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bio</label>
                <textarea 
                  name="bio" 
                  defaultValue={initialProfile?.bio || ''} 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px] resize-none text-sm leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                type="submit" 
                disabled={isCompressing}
                className="w-full bg-black text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.2em] disabled:bg-gray-400"
              >
                {isCompressing ? "保存中..." : "Save Changes"}
              </button>
              
              <Link 
                href={userPagePath}
                className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl text-center block text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}