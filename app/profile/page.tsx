import { createClient } from '../../utils/supabase/server'
import { updateProfile } from '../actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  
  if (!user) redirect('/login')

  // 現在のプロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('id', user.id)
    .single()

  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-black pb-12 font-sans">
      {/* ナビゲーション：タイムラインと同じスタイル */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-6">
        <div className="max-w-2xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            キャンセル
          </Link>
          <h1 className="text-sm font-bold italic">Profile Settings</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4">
        <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
          {/* actionに直接関数を指定（encType不要） */}
          <form action={updateProfile} className="space-y-8">
            
            {/* プロフィール画像表示：タイムラインの投稿者アイコン風 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-md bg-gray-100">
                <img 
                  src={profile?.avatar_url || defaultAvatar} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                />
              </div>
              <label className="cursor-pointer bg-gray-50 text-gray-600 px-6 py-2 rounded-full text-[10px] font-black border border-gray-200 hover:bg-gray-100 transition-all uppercase tracking-widest">
                写真を変更
                <input name="avatar" type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            <div className="space-y-6">
              {/* ユーザーネーム入力：タイムラインのtextarea風のデザイン */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">User Name</label>
                <input 
                  name="fullName" 
                  type="text" 
                  defaultValue={profile?.full_name || ''} 
                  placeholder="お名前"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border-none focus:ring-2 focus:ring-black/5 transition-all text-sm" 
                  required 
                />
              </div>

              {/* 自己紹介入力：タイムラインの投稿フォームと同じデザイン */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bio</label>
                <textarea 
                  name="bio" 
                  defaultValue={profile?.bio || ''} 
                  placeholder="自己紹介を書いてみましょう"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px] resize-none text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* 保存ボタン：タイムラインの「投稿をシェア」ボタンと共通 */}
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-wide"
              >
                設定を保存する
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}