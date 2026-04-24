'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * ログイン
 */
export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=auth-failed')
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * ログアウト
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * プロフィール画像アップロード
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file || file.size === 0) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const fileName = `${user.id}.jpg`
  
  // upsert: true で既存の画像を上書き可能にする
  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (error) console.error('Upload Error:', error.message)
  revalidatePath('/')
}

/**
 * 投稿作成
 */
export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  if (!content || content.trim() === '') return

  const { data: { user } } = await supabase.auth.getUser()
  
  // Storageの公開URLを生成
  const avatarUrl = user && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.jpg`
    : null

  await supabase.from('posts').insert({ 
    content, 
    user_name: 'Gimax',
    avatar_url: avatarUrl 
  })
  revalidatePath('/')
}

/**
 * コメント作成
 */
export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string
  if (!content || content.trim() === '') return
  await supabase.from('comments').insert({ 
    content, 
    post_id: Number(postId), 
    user_name: 'Gimax' 
  })
  revalidatePath('/')
}