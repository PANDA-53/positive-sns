"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI判定ロジック
 */
async function checkContentWithCustomRules(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはSNSのモデレーターです。判定結果のみ(SAFE/TOXIC)返してください。`
        },
        { role: "user", content: content }
      ],
      temperature: 0,
    });
    return response.choices[0].message.content?.includes("TOXIC");
  } catch (error) {
    return false;
  }
}

// --- 認証系 ---
export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?error=auth-failed');
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return redirect('/login?error=signup-failed');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// --- 投稿・返信系 ---
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const isToxic = await checkContentWithCustomRules(content);
  if (isToxic) return redirect('/?error=toxic-content');
  await supabase.from('posts').insert({ content, user_id: user.id });
  revalidatePath('/');
  redirect('/'); 
}

export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const isToxic = await checkContentWithCustomRules(content);
  if (isToxic) return redirect('/?error=toxic-content');
  await supabase.from('posts').insert({ content, parent_id: parentId, user_id: user.id });
  revalidatePath('/');
  redirect('/'); 
}

// --- プロフィール更新（デバッグ強化版） ---
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatar') as File;
  
  // 1. ユーザーチェック
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return redirect('/login');

  // 2. 既存の画像URLを保持
  const { data: current } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();
  
  let avatarUrl = current?.avatar_url || null;

  // 3. 画像アップロード
  if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });
    
    if (uploadError) {
      console.error("Storage Error:", uploadError.message);
      // ストレージエラーがあればURLに表示して止める
      return redirect(`/profile?error=storage_${encodeURIComponent(uploadError.message)}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    avatarUrl = publicUrl;
  }

  // 4. DB更新
  const updateData = { 
    id: user.id, 
    full_name: fullName,
    bio: bio,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(), 
  };

  const { error: dbError } = await supabase.from('profiles').upsert(updateData);

  if (dbError) {
    console.error("DB Error:", dbError.message);
    // DBエラーがあればURLに表示して止める（ここで「テーブルがない」等の理由がわかります）
    return redirect(`/profile?error=db_${encodeURIComponent(dbError.message)}`);
  }

  // 5. 成功時の処理
  revalidatePath('/', 'layout'); 
  revalidatePath('/profile');
  revalidatePath(`/users/${user.id}`);
  redirect(`/users/${user.id}`);
}

// --- リアクション・友達機能（省略せず保持） ---
export async function handleReaction(postId: number, reactionType: 'awesome' | 'hug') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase.from('reactions').select('id').eq('post_id', postId).eq('user_id', user.id).eq('type', reactionType).single();
  if (existing) { await supabase.from('reactions').delete().eq('id', existing.id); } 
  else { await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type: reactionType }); }
  revalidatePath('/');
}

export async function sendFriendRequest(friendId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').insert({ user_id: user.id, friend_id: friendId, status: 'pending' });
  revalidatePath('/');
}

export async function acceptFriendRequest(formData: FormData) {
  const requesterId = formData.get('requesterId') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !requesterId) return;
  await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id);
  revalidatePath('/'); 
}

export async function deleteFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').delete().or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);
  revalidatePath('/');
}