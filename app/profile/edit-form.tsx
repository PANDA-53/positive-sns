"use client"

import { useState, useEffect } from 'react'
import { updateProfile, updatePushSubscription } from '../actions'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const GOLD_COLOR = "#B8860B";

// --- 通知設定用サブコンポーネント ---
function NotificationSetter({ userId, initialSubscription }: { userId: string, initialSubscription: any }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(!!initialSubscription);
  
  const VAPID_PUBLIC_KEY = "BJEoIlcIMB4uXEChjfcDjdzdu2wNrVgklCvK2Qyjbulq0FBoM9IFcOPaI3gsv_ZEdAgnngCVICjIqO5baG0ZIvs";

  useEffect(() => {
    async function checkSubscription() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setHasSubscription(true);
          }
        } catch (e) {
          console.error("通知状態の確認に失敗しました", e);
        }
      }
    }
    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error("このブラウザは通知に対応していません");
      return;
    }

    setIsSubscribing(true);
    try {
      await navigator.serviceWorker.register('/sw.js');
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
    <div className="bg-[#FAF9F6] p-5 rounded-[1.5rem] border border-[#B8860B]/10 space-y-3 mt-4 shadow-sm">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_COLOR }}>Push Notification</p>
          <p className="text-[11px] text-gray-500 font-bold">リアクションや返信をリアルタイムで通知</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${hasSubscription ? 'animate-pulse' : 'bg-gray-300'}`} style={hasSubscription ? { backgroundColor: GOLD_COLOR } : {}} />
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isSubscribing || hasSubscription}
        className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
          hasSubscription 
          ? "bg-white text-gray-400 border border-gray-100 cursor-default" 
          : "text-white shadow-md shadow-[#B8860B]/20"
        }`}
        style={!hasSubscription && !isSubscribing ? { backgroundColor: GOLD_COLOR } : {}}
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
      console.error(error)
      toast.error('更新に失敗しました')
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    /* 修正箇所：mainからbg/styleでの背景色指定を完全に削除。layout.tsxのbody色が透けて見えます。 */
    <main className="min-h-screen pb-12 font-sans pt-6">
      <div className="max-w-2xl mx-auto px-4">
        {/* 白いカードがベージュの上で際立つよう、少しだけシャドウを強化しています */}
        <section className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2DED0]">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-md bg-[#FDFCF9]" style={{ borderColor: GOLD_COLOR }}>
                <img 
                  src={previewUrl || defaultAvatar} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                />
              </div>
              <label 
                className="cursor-pointer px-6 py-2 rounded-full text-[10px] font-black border transition-all uppercase tracking-widest active:scale-95 shadow-sm"
                style={{ backgroundColor: '#F9F6E5', color: GOLD_COLOR, borderColor: '#B8860B33' }}
              >
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
                <label className="text-[10px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>User Name</label>
                <input 
                  name="fullName" 
                  type="text" 
                  defaultValue={initialProfile?.full_name || ''} 
                  className="w-full p-4 bg-[#FDFCF9] rounded-2xl outline-none text-black border border-[#E2DED0]/50 focus:ring-2 focus:ring-[#B8860B]/10 transition-all text-sm font-bold shadow-inner" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-4" style={{ color: GOLD_COLOR }}>Bio</label>
                <textarea 
                  name="bio" 
                  defaultValue={initialProfile?.bio || ''} 
                  className="w-full p-4 bg-[#FDFCF9] rounded-2xl outline-none text-black border border-[#E2DED0]/50 focus:ring-2 focus:ring-[#B8860B]/10 transition-all min-h-[120px] resize-none text-sm leading-relaxed shadow-inner"
                />
              </div>

              <NotificationSetter 
                userId={initialProfile?.id} 
                initialSubscription={initialProfile?.push_subscription} 
              />
            </div>

            <div className="space-y-3 pt-4">
              <button 
                type="submit" 
                disabled={isCompressing}
                className="w-full text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.2em] disabled:bg-gray-400"
                style={!isCompressing ? { backgroundColor: GOLD_COLOR } : {}}
              >
                {isCompressing ? "保存中..." : "Save Changes"}
              </button>
              
              <Link 
                href={userPagePath}
                className="w-full bg-[#F5F5F0] text-gray-400 font-black py-4 rounded-2xl text-center block text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all hover:bg-[#EBEBE0]"
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