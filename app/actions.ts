"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ログイン処理 (image_982d4f.png のエラーを解消)
export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?error=auth-failed');

  revalidatePath('/', 'layout');
  redirect('/');
}

// 投稿作成
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('posts').insert({
    content,
    user_id: user.id,
    user_name: 'Gimax', 
  });
  revalidatePath('/');
}

// 返信機能 (image_a32d58.png の parent_id カラムを活用)
export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('posts').insert({
    content,
    user_id: user.id,
    user_name: 'Gimax',
    parent_id: parentId,
  });
  revalidatePath('/');
}

// プロフィール写真アップロード
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !file) return;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(`${user.id}.png`, file, { upsert: true });

  if (!error) revalidatePath('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}