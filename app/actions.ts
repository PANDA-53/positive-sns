"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 【NEW】TanStack Query 用のデータ取得アクション
 * タイムラインに必要な投稿、プロフィール、友達関係、申請状況をすべて整形して返します
 */
export async function fetchTimelineData(userId: string) {
  const supabase = await createClient();
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";

  // 1. 投稿と友達関係を並列取得
  const [postsRes, friendshipsRes] = await Promise.all([
    supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  ]);

  const posts = postsRes.data || [];
  const friendshipsRaw = friendshipsRes.data || [];

  // 2. 関連する全ユーザーのプロフィールを一括取得
  const postUserIds = posts.map(p => p.user_id);
  const allFriendUserIds = friendshipsRaw.map(f => f.user_id === userId ? f.friend_id : f.user_id);
  const allRelevantUserIds = Array.from(new Set([...postUserIds, ...allFriendUserIds, userId]));

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', allRelevantUserIds);

  // 3. 届いている友達申請の整理
  const pendingRequests = friendshipsRaw
    .filter(f => String(f.friend_id) === String(userId) && f.status === 'pending')
    .map(f => ({
      user_id: f.user_id,
      sender_profile: allProfiles?.find(p => p.id === f.user_id)
    })).filter(req => req.sender_profile);

  // 4. 承認済み友達リストの整理
  const uniqueFriendIds = new Set(
    friendshipsRaw.filter(f => f.status === 'accepted').map(f => (String(f.user_id) === String(userId) ? f.friend_id : f.user_id))
  );
  const acceptedFriends = Array.from(uniqueFriendIds)
    .map(id => allProfiles?.find(p => id === p.id))
    .filter(Boolean);

  // 5. 投稿データの整形（リアクション数、自分との関係性など）
  const formattedPosts = posts.map(post => {
    const reactions = post.reactions || [];
    const authorProfile = allProfiles?.find(p => p.id === post.user_id);
    const relation = friendshipsRaw.find(f => 
      (String(f.user_id) === String(userId) && String(f.friend_id) === String(post.user_id)) || 
      (String(f.user_id) === String(post.user_id) && String(f.friend_id) === String(userId))
    );
    
    return {
      ...post,
      authorProfile,
      awesomeCount: reactions.filter((r: any) => r.type === 'awesome').length,
      hugCount: reactions.filter((r: any) => r.type === 'hug').length,
      myReaction: reactions.find((r: any) => r.user_id === userId)?.type || null,
      friendStatus: post.user_id === userId ? 'me' : (relation?.status || 'none')
    };
  });

  const mainPosts = formattedPosts.filter(p => !p.parent_id);
  const replies = formattedPosts.filter(p => p.parent_id);

  return {
    mainPosts,
    replies,
    pendingRequests,
    acceptedFriends,
    defaultAvatar
  };
}

/**
 * SNS「POSITIVES」モデレーター判定ロジック
 */
async function checkAndSuggestContent(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはSNS「POSITIVES」のモデレーター兼、優秀なリライトエディターです。以下の厳格な基準に従って投稿を判定し、不適切な場合はユーザーを導いてください。...（中略）...`
        },
        { 
          role: "user", 
          content: `判定対象：\n\n"${content}"` 
        }
      ],
      temperature: 0.5,
    });

    const result = response.choices[0].message.content || "";
    
    if (result.startsWith("SAFE")) {
      return { isToxic: false, reason: "", suggestions: [] };
    } else {
      const parts = result.split("|").map(s => 
        s.trim().replace(/^["「']|["」']$/g, '') 
      );
      return { 
        isToxic: true, 
        reason: parts[1] || "規約に抵触する可能性があります", 
        suggestions: parts.slice(2) 
      };
    }
  } catch (error) {
    console.error("AI判定エラー:", error);
    return { isToxic: false, reason: "", suggestions: [] }; 
  }
}

// --- 投稿作成 (動画・公開範囲対応版) ---
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File | null;
  const videoFile = formData.get('video') as File | null;
  const privacyLevel = (formData.get('privacy_level') as string) || 'public';
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content' };

  let imageUrl = null;
  let videoUrl = null;

  if (videoFile && videoFile.size > 0 && videoFile.name !== 'undefined') {
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, videoFile);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName);
      videoUrl = publicUrl;
    }
  }

  if (!videoUrl && imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, imageFile);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  await supabase.from('posts').insert({ 
    content, 
    user_id: user.id, 
    image_url: imageUrl,
    video_url: videoUrl,
    privacy_level: privacyLevel 
  });

  revalidatePath('/');
  return { isToxic: false };
}

// --- 返信作成 ---
export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isToxic: false };

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { isToxic: true, reason: result.reason, suggestions: result.suggestions };

  await supabase.from('posts').insert({ content, parent_id: parentId, user_id: user.id });
  revalidatePath('/');
  return { isToxic: false };
}

// --- フレンド・削除・リアクション（既存） ---

export async function deleteFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').delete().eq('user_id', user.id).eq('friend_id', targetUserId);
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

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: formData.get('email') as string, password: formData.get('password') as string });
  if (error) return redirect('/login?error=auth-failed');
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: formData.get('email') as string, password: formData.get('password') as string });
  if (error) return redirect('/login?error=signup-failed');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function handleReaction(postId: number, reactionType: 'awesome' | 'hug') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase.from('reactions').select('id').eq('post_id', postId).eq('user_id', user.id).eq('type', reactionType).single();
  if (existing) { await supabase.from('reactions').delete().eq('id', existing.id); }
  else { await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type: reactionType }); }
  revalidatePath('/');
}

export async function deletePost(formData: FormData) {
  const postId = formData.get('postId') as string;
  const supabase = await createClient();
  await supabase.from('posts').delete().eq('id', postId);
  revalidatePath('/');
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatar') as File;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: current } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
  let avatarUrl = current?.avatar_url || null;

  if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    avatarUrl = publicUrl;
  }

  await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, bio: bio, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
  revalidatePath('/', 'layout');
  redirect(`/users/${user.id}`);
}

export async function reportPost(postId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "ログインが必要です" };
  const { error } = await supabase.from('reports').insert({ post_id: postId, reporter_id: user.id });
  if (error) {
    if (error.code === '23505') return { success: false, message: "既に報告済みです" };
    return { success: false, message: "エラーが発生しました" };
  }
  return { success: true };
}

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return [];
  const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${query}%`).neq('id', currentUser.id).limit(20);
  if (error) return [];
  return data;
}

export async function cancelFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').delete().or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);
  revalidatePath('/');
}