"use client"

import { useState } from 'react'
import { updateProfile, updatePushSubscription } from '../actions' // ★updatePushSubscriptionを追加
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// --- 通知設定用サブコンポーネント ---
function NotificationSetter({ userId, initialSubscription }: { userId: string, initialSubscription: any }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(!!initialSubscription);
  
  // ★ ここに generate-vapid-keys で取得した公開鍵を貼る
  const VAPID_PUBLIC_KEY = "BJEoIlcIMB4uXEChjfcDjdzdu2wNrVgklCvK2Qyjbulq0FBoM9IFcOPaI3gsv_ZEdAgnngCVICjIqO5baG0ZIvs";

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error("このブラウザは通知に対応していません");
      return;
    }

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      await updatePushSubscription(JSON.stringify(subscription));
      setHasSubscription(true);
      toast.success("通知が有効になりました！");
    } catch (error) {
      console.error(error);
      toast.error("設定失敗。ホーム画面に追加して起動してください。");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100 space-y-3 mt-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Push Notification</p>
          <p className="text-[11px] text-gray-500 font-bold">リアクションや返信をリアルタイムで通知</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${hasSubscription ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isSubscribing || hasSubscription}
        className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
          hasSubscription 
          ? "bg-white text-gray-400 border border-gray-200 cursor-default" 
          : "bg-green-600 text-white shadow-md hover:bg-green-700"
        }`}
      >
        {isSubscribing ? "Setting up..." : hasSubscription ? "Notifications Active" : "Enable Push Notifications"}
      </button>
    </div>
  );
}

// --- メインコンポーネント ---
export default function ProfileEditForm({ initialProfile }: { initialProfile: any }) {
  const [previewUrl, setPreviewUrl] = useState(initialProfile?.avatar_url)
  const [isCompressing, setIsCompressing] = useState(false)
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
  const router = useRouter()

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
      const imageFile = formData.get('avatar') as File
      if (imageFile && imageFile.size > 1024 * 1024) {
        const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1200, useWebWorker: true }
        const compressedFile = await imageCompression(imageFile, options)
        formData.set('avatar', compressedFile, compressedFile.name)
      }

      await updateProfile(formData)
      toast.success('プロフィールを更新しました')
      router.refresh()
      router.push(userPagePath)

    } catch (error: any) {
      router.refresh()
      window.location.href = userPagePath 
    } finally {
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

              {/* ★ 追加：通知設定セクションをBioの下に配置 */}
              <NotificationSetter 
                userId={initialProfile?.id} 
                initialSubscription={initialProfile?.push_subscription} 
              />
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