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
          content: `
            あなたはSNSのモデレーターです。以下のルールに従い、投稿を「許可(SAFE)」か「拒否(TOXIC)」で判定してください。
            判定結果のみを返してください。

            【拒否する基準】
            1. 他者への攻撃、悪口、馬鹿にするような表現。
            2. 差別的な内容。
            3. 政治、宗教、または特定の団体への攻撃。

            【許可する基準】
            1. ポジティブな日常。
            2. 感謝、励まし。
            3. 後悔や自責（死にたい等）はSAFE。
          `
        },
        { role: "user", content: content }
      ],
      temperature: 0,
    });
    const result = response.choices[0].message.content;
    return result?.includes("TOXIC");
  } catch (error) {
    console.error("AI判定エラー:", error);
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

// --- プロフィール更新 ---
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string; // 自己紹介を取得
  const avatarFile = formData.get('avatar') as File;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect('/login');

  let avatarUrl = null;
  // 画像が選択されている場合のみアップロード処理
  if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = publicUrl;
    }
  }

  // 更新用データの構築
  const updateData: any = { 
    id: user.id, 
    full_name: fullName,
    bio: bio 
  };
  
  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  // データベース更新
  const { error } = await supabase.from('profiles').upsert(updateData);

  if (error) {
    console.error("Profile update error:", error);
    // エラー時は元のページにエラーをつけて戻す等の処理が必要な場合もありますが、一旦リダイレクト
    return redirect(`/users/${user.id}?error=update-failed`);
  }

  revalidatePath('/', 'layout');
  // 保存後は自分のプロフィール詳細ページへリダイレクト
  redirect(`/users/${user.id}`);
}

// --- リアクション ---
export async function handleReaction(postId: number, reactionType: 'awesome' | 'hug') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase.from('reactions').select('id').eq('post_id', postId).eq('user_id', user.id).eq('type', reactionType).single();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
  } else {
    await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type: reactionType });
  }
  revalidatePath('/');
}

// --- 友達機能 ---
export async function sendFriendRequest(friendId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('friendships').insert({ user_id: user.id, friend_id: friendId, status: 'pending' });
  revalidatePath('/');
}

export async function acceptFriendRequest(formData: FormData) {
  const requesterId = formData.get('requesterId') as string;
  if (!requesterId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requesterId)
    .eq('friend_id', user.id);

  if (error) {
    console.error('承認エラー:', error);
  } else {
    revalidatePath('/'); 
  }
}

export async function deleteFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);

  revalidatePath('/');
}