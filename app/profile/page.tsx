import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from './edit-form'
import { Suspense } from 'react'
import Link from 'next/link'

// --- データ取得専用のコンポーネント ---
async function ProfileContent({ userId }: { userId: string }) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('id', userId)
    .single()

  return <ProfileEditForm initialProfile={profile} />
}

// --- メインのページコンポーネント ---
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-[#F2F2F2] font-sans text-black pb-12">
      {/* ナビゲーションバー：他画面と統一 */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-4">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            <span>Back</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4">
        <Suspense fallback={
          <div className="animate-pulse p-6 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mt-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded-xl w-1/3 mx-auto mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
              <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            </div>
          </div>
        }>
          <ProfileContent userId={user.id} />
        </Suspense>
      </div>
    </main>
  )
}