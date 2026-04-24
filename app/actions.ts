"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * ログイン処理
 * ログインページ (app/login/page.tsx) から呼び出されます
 */
export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    return redirect('/login?error=auth-failed');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * 新規投稿作成
 */
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('posts').insert({
    content,
    user_id: user.id,
    user_name: 'Gimax', // 必要に応じて固定の名前を設定
  });

  revalidatePath('/');
}

/**
 * 返信作成
 * parent_id カラムを使用して投稿を紐付けます
 */
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
    parent_id: parentId, // どの投稿への返信かを指定
  });

  revalidatePath('/');
}

/**
 * ログアウト
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}