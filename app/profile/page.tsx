import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from './edit-form'
import { Suspense } from 'react'
import Link from 'next/link'

// 金色の共通色
const GOLD_COLOR = "#B8860B";

// --- データ取得専用のコンポーネント ---
async function ProfileContent({ userId }: { userId: string }) {
  const supabase = await createClient()
  
  // プロフィール情報のみを取得（不要な集計や結合はすべて削除）
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('id', userId)
    .single()

  return (
    <div className="space-y-4">
      {/* 編集フォームのみをすっきりと配置 */}
      <ProfileEditForm initialProfile={profile} />
    </div>
  )
}

// --- メメインのページコンポーネント ---
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-[#F2F2F2] font-sans text-black pb-12">
      {/* ナビゲーションバー：文字とアイコンを金色に */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-4">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-[11px] font-black transition-colors uppercase tracking-widest hover:opacity-70"
            style={{ color: GOLD_COLOR }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={3} 
              stroke="currentColor" 
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Back</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4">
        <Suspense fallback={
          /* スケルトンも少し高級感のある色味に */
          <div className="animate-pulse p-6 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mt-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 border-2 border-gray-50"></div>
            <div className="h-4 bg-gray-100 rounded-xl w-1/3 mx-auto mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
              <div className="h-24 bg-gray-50 rounded-xl w-full"></div>
            </div>
          </div>
        }>
          <ProfileContent userId={user.id} />
        </Suspense>
      </div>
    </main>
  )
}