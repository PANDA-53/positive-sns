import { createClient } from '../../utils/supabase/server'
import { updateProfile } from '../actions'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 現在のプロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl w-full max-w-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-8">プロフィール設定</h1>
        
        <form action={updateProfile} className="space-y-6">
          <div>
            <label className="text-xs text-gray-400 ml-2 mb-1 block">ユーザー名</label>
            <input 
              name="fullName" 
              type="text" 
              defaultValue={profile?.full_name || ''} 
              placeholder="新しい名前を入力"
              className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all"
              required 
            />
          </div>
          
          <div className="space-y-3">
            <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all">
              保存する
            </button>
            <a href="/" className="block text-center text-sm text-gray-400 hover:text-black transition-colors">
              キャンセル
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}