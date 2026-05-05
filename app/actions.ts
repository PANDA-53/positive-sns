"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          content: `あなたはSNS「POSITIVES」のモデレーター兼、優秀なリライトエディターです。以下の厳格な基準に従って投稿を判定し、不適切な場合はユーザーを導いてください。

【TOXIC（投稿禁止）】
・他者への誹謗中傷、攻撃的発言、差別、偏見、尊厳を傷つける内容
・コミュニティの和を乱す攻撃的な言葉、他者を不快にする自己中心的な主張
・他者の投稿を否定するコメント
・「sine(死ね)」「uzai(うざい)」等の隠語や、否定的感情を表す絵文字
・「好きじゃない」「ダサい」などの主観的な否定的意見

【SAFE（許可）】
・ポジティブな内容、笑顔にする内容
・自責や後悔（自分はダメだ、死にたい等）は、他者を攻撃していないため「SAFE」と判定してください。

【出力ルール】
1. SAFEの場合： "SAFE" とのみ出力。
2. TOXICの場合： 必ず以下の形式（パイプ区切り）で出力してください。
    NG | 理由 | 言い換え案1 | 言い換え案2 | 言い換え案3

【言い換え案作成の重要ルール】
・単語の置き換えではなく、文章全体の「内容」を維持したまま、棘のない「内省・独り言」にリライトしてください。
・そのまま投稿ボタンを押して使える「ユーザー自身の独り言（セリフ）」のみを出力してください。
・文体は「〜だなぁ」「〜かも」「〜かな？」など、SNSで自然な話し言葉にしてください。`
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
      const parts = result.split("|").map(s => s.trim().replace(/^["「']|["」']$/g, ''));
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

/**
 * 1. 認証関連
 */
export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?error=auth-failed');
  revalidatePath('/', 'layout');
  return redirect('/');
}

export async function signup(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return redirect('/login?error=signup-failed');
  revalidatePath('/', 'layout');
  return redirect('/login?message=success');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return redirect('/login');
}

/**
 * 2. タイムライン表示用データの取得
 */
export async function fetchTimelineData(userId: string) {
  const supabase = await createClient();
  const [postsRes, commentsRes, friendshipsRes, reactionsRes] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('comments').select('*').order('created_at', { ascending: true }),
    supabase.from('friendships').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    supabase.from('reactions').select('*')
  ]);

  const posts = postsRes.data || [];
  const reactions = reactionsRes.data || [];
  const comments = commentsRes.data || [];

  const formattedPosts = posts.map(post => ({
    ...post,
    reactions: reactions.filter(r => r.post_id === post.id),
    comments: comments.filter(c => c.post_id === post.id)
  }));

  return { 
    formattedPosts, 
    pendingRequests: (friendshipsRes.data || []).filter(f => String(f.friend_id) === String(userId) && f.status === 'pending'),
    acceptedFriends: (friendshipsRes.data || []).filter(f => f.status === 'accepted')
  };
}

/**
 * 3. プロフィールデータの取得
 */
export async function fetchUserProfileData(targetUserId: string, currentUserId: string) {
  const supabase = await createClient();
  const cleanTargetId = targetUserId.toLowerCase().trim();

  const [profileRes, postsRes, friendshipRes, allReactionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', cleanTargetId).single(),
    supabase.from('posts').select('*').eq('user_id', cleanTargetId).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`and(user_id.eq.${currentUserId},friend_id.eq.${cleanTargetId}),and(user_id.eq.${cleanTargetId},friend_id.eq.${currentUserId})`).single(),
    supabase.from('reactions').select('*')
  ]);

  const posts = postsRes.data || [];
  const reactions = allReactionsRes.data || [];

  const formattedPosts = posts.map((post: any) => {
    const postReactions = reactions.filter((r: any) => r.post_id === post.id);
    return {
      ...post,
      awesomeCount: postReactions.filter((r: any) => r.type === 'awesome').length,
      hugCount: postReactions.filter((r: any) => r.type === 'hug').length,
      myReaction: postReactions.find((r: any) => r.user_id === currentUserId)?.type || null,
      commentsCount: 0 
    };
  });

  return {
    profile: profileRes.data,
    mainPosts: formattedPosts, 
    friendship: friendshipRes.data,
    isMe: cleanTargetId === currentUserId, 
    error: profileRes.error
  };
}

/**
 * 4. 投稿・返信作成（画像アップロード対応）
 */
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const privacyLevel = (formData.get('privacy_level') as string) || 'public';
  const imageFile = formData.get('image') as File | null; 
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content' };

  let imageUrl = null;

  // 画像アップロード処理
  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts') 
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  await supabase.from('posts').insert({ 
    content, 
    user_id: user.id, 
    privacy_level: privacyLevel,
    image_url: imageUrl 
  });

  revalidatePath('/');
  revalidatePath(`/users/${user.id}`);
  return { isToxic: false };
}

export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isToxic: false };

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return result;

  await supabase.from('comments').insert({ 
    content, 
    post_id: parseInt(parentId), 
    user_id: user.id,
    user_name: user.email 
  });

  revalidatePath('/');
  return { isToxic: false };
}

/**
 * 5. フレンド機能
 */
export async function sendFriendRequest(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').insert({ user_id: user.id, friend_id: targetUserId, status: 'pending' });
  revalidatePath(`/users/${targetUserId}`);
}

export async function deleteFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').delete().or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);
  revalidatePath(`/users/${targetUserId}`);
}

export async function acceptFriendRequest(formData: FormData) {
  const requesterId = formData.get('requesterId') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !requesterId) return;
  await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id);
  revalidatePath('/');
}

/**
 * 6. プロフィール更新
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatar') as File;
  
  const { data: current } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
  let avatarUrl = current?.avatar_url || null;

  if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
    const fileName = `${user.id}/${Date.now()}.${avatarFile.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
    if (!uploadError) {
      avatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
    }
  }

  await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, bio: bio, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
  revalidatePath('/', 'layout');
  return redirect(`/users/${user.id}`);
}

export async function reportPost(postId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "ログインが必要です" };
  const { error } = await supabase.from('reports').insert({ post_id: postId, reporter_id: user.id });
  return { success: !error };
}

/**
 * 7. リアクション・削除
 */
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
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('posts').delete().eq('id', postId);
  revalidatePath('/');
  if (user) revalidatePath(`/users/${user.id}`);
}