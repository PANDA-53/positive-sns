'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 投稿作成
export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  if (!content || content.trim() === '') return

  await supabase.from('posts').insert({ 
    content,
    user_name: 'Gimax'
  })
  revalidatePath('/')
}

// コメント作成
export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string // stringで受け取りますが、Supabase側で数値変換されます

  if (!content || content.trim() === '') return

  const { error } = await supabase.from('comments').insert({ 
    content, 
    post_id: Number(postId), // 確実に数値として送信
    user_name: 'Gimax' 
  })

  if (error) console.error('コメント投稿エラー:', error.message)
  revalidatePath('/')
}