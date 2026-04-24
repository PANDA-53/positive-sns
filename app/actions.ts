"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;

  // ログインユーザーを確実に取得
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // user_id を明示的に紐付けて保存
  const { error } = await supabase.from('posts').insert({
    content,
    user_id: user.id,
    user_name: 'Gimax', // 必要に応じて user.email などに変更
  });

  if (error) {
    console.error("投稿エラー:", error.message);
  }

  revalidatePath('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !file) return;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(`${user.id}.png`, file, { upsert: true });

  if (!error) {
    revalidatePath('/');
  }
}