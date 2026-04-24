'use server'

import { createClient } from '../utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=auth-failed')
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// プロフィール画像のアップロード処理
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file || file.size === 0) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const fileName = `${user.id}.png`
  
  // Storageへアップロード
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('Upload Error:', uploadError.message)
    return
  }

  revalidatePath('/')
}

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  if (!content || content.trim() === '') return

  const { data: { user } } = await supabase.auth.getUser()
  const avatarUrl = user 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png`
    : null

  // 投稿時にアバターURLも保存
  await supabase.from('posts').insert({ 
    content, 
    user_name: 'Gimax',
    avatar_url: avatarUrl 
  })
  revalidatePath('/')
}

export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string
  if (!content || content.trim() === '') return
  await supabase.from('comments').insert({ content, post_id: Number(postId), user_name: 'Gimax' })
  revalidatePath('/')
}