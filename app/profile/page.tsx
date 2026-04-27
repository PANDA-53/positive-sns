import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from './edit-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // サーバー側でデータを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio')
    .eq('id', user.id)
    .single()

  // 取得したデータを、ステップ1で作った「見た目担当」に渡す
  return (
    <ProfileEditForm initialProfile={profile} />
  )
}