'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string

  if (!content || content.trim() === '') return

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('posts')
    .insert({ 
      content,
      user_name: 'Gimax' // 今後のステップで profiles から取得するように拡張可能
    })

  if (error) {
    console.error('投稿エラー:', error.message)
    return
  }

  revalidatePath('/')
}