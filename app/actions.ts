'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 投稿（Post）を作成する関数
export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string

  if (!content || content.trim() === '') return

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('posts')
    .insert({ 
      content,
      user_name: 'Gimax' // profilesテーブルを本格運用するまでは固定値
    })

  if (error) {
    console.error('投稿エラー:', error.message)
    return
  }

  revalidatePath('/')
}

// コメント（Comment）を作成する関数
export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string

  if (!content || content.trim() === '') return

  const { error } = await supabase
    .from('comments')
    .insert({ 
      content, 
      post_id: postId,
      user_name: 'Gimax' 
    })

  if (error) {
    console.error('コメントエラー:', error.message)
    return
  }

  revalidatePath('/')
}