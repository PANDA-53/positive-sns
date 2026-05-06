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
          content: `あなたはSNS「POSITIVES」の守護聖人であり、卓越した言葉の錬金術師です。
あなたの使命は、投稿から「毒」を抜き、ユーザーの「本音」を誰も傷つかない「輝き」に変えることです。

【判定基準：POSITIVES・ルール】
・TOXIC（即書き換え対象）：
  - 攻撃の矛先が「外（他者・社会・特定の誰か）」に向いているもの。
  - 否定的な断定（「〜はダメだ」「〜すべきでない」）。
  - 文脈に潜む「皮肉」や「冷笑」。
  - 負のエネルギーを伝染させる強い言葉。

・SAFE（受け入れ）：
  - 矛先が「内（自分）」に向いている弱音、悲しみ、後悔。
  - 喜び、感謝、些細な幸せの共有。

【出力ルール】
1. SAFEの場合： "SAFE" とのみ出力。
2. TOXICの場合： 以下の形式で出力。
    NG | 理由 | 案1 | 案2 | 案3

文末のニュアンス：
案1：寄り添い（癒やし系）
案2：内省（クール・自分軸）
案3：変換（ポジティブ・ユーモア）
「〜しましょう」というアドバイス形式は禁止。ユーザーがそのまま投稿ボタンを押して使える「独り言」のみを出力すること。`
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
 * 2. メインタイムライン用データ取得
 */
export async function fetchMainTimelineData(userId: string) {
  const supabase = await createClient();
  
  const [postsRes, friendshipsRes] = await Promise.all([
    supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  ]);

  const posts = postsRes.data || [];
  const friendshipsRaw = friendshipsRes.data || [];

  const postUserIds = posts.map(p => p.user_id);
  const friendUserIds = friendshipsRaw.map(f => (f.user_id === userId ? f.friend_id : f.user_id));
  const allRelevantIds = Array.from(new Set([...postUserIds, ...friendUserIds, userId])).filter(Boolean);

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', allRelevantIds);

  const friendMap = new Map();
  friendshipsRaw
    .filter(f => f.status === 'accepted')
    .forEach(f => {
      const fid = f.user_id === userId ? f.friend_id : f.user_id;
      const profile = allProfiles?.find(p => p.id === fid);
      if (profile) friendMap.set(fid, profile);
    });
  
  const acceptedFriends = Array.from(friendMap.values());

  const pendingRequests = friendshipsRaw
    .filter(f => f.friend_id === userId && f.status === 'pending')
    .map(f => ({
      user_id: f.user_id,
      sender_profile: allProfiles?.find(p => p.id === f.user_id)
    }))
    .filter(req => req.sender_profile);

  const formattedPosts = posts.map(post => ({
    ...post,
    authorProfile: allProfiles?.find(p => p.id === post.user_id) || { full_name: '匿名', avatar_url: '' },
    awesomeCount: post.reactions?.filter((r: any) => r.type === 'awesome').length || 0,
    hugCount: post.reactions?.filter((r: any) => r.type === 'hug').length || 0,
    myReaction: post.reactions?.find((r: any) => r.user_id === userId)?.type || null,
  }));

  return {
    mainPosts: formattedPosts.filter(p => !p.parent_id),
    replies: formattedPosts.filter(p => p.parent_id),
    friendIds: Array.from(friendMap.keys()) as string[], 
    pendingRequests,
    acceptedFriends
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
    };
  });

  return {
    profile: profileRes.data,
    mainPosts: formattedPosts.filter(p => !p.parent_id), 
    friendship: friendshipRes.data,
    isMe: cleanTargetId === currentUserId, 
    error: profileRes.error
  };
}

/**
 * 4. 投稿・返信作成
 */
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parent_id') ? parseInt(formData.get('parent_id') as string) : null;
  const privacyLevel = (formData.get('privacy_level') as string) || 'public';
  
  const imageFile = formData.get('image') as File | null;
  const videoFile = formData.get('video') as File | null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content' };

  let imageUrl = null;
  let videoUrl = null;

  // --- ストレージ保存処理 (省略なし) ---
  if (imageFile && imageFile.size > 0) {
    const rawName = imageFile.name || "";
    const fileExt = rawName.includes('.') ? rawName.split('.').pop() : 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('post_images').upload(fileName, imageFile);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  if (videoFile && videoFile.size > 0) {
    const rawName = videoFile.name || "";
    const fileExt = rawName.includes('.') ? rawName.split('.').pop() : 'mp4';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('videos').upload(fileName, videoFile);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);
      videoUrl = publicUrl;
    }
  }

  const { error: insertError } = await supabase.from('posts').insert({ 
    content, 
    user_id: user.id, 
    privacy_level: privacyLevel,
    image_url: imageUrl,
    video_url: videoUrl,
    parent_id: parentId 
  });

  if (insertError) return { isToxic: false, error: "DB保存失敗" };

  // ★ 修正ポイント：キャッシュの再検証を確実に実行
  // 'page' だけでなく 'layout' も含めて再検証することで、タイムラインの更新漏れを防ぎます
  revalidatePath('/', 'layout'); 
  revalidatePath(`/users/${user.id}`, 'layout');
  
  return { isToxic: false, success: true };
}

export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isToxic: false };

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return result;

  await supabase.from('posts').insert({ 
    content, 
    parent_id: parseInt(parentId), 
    user_id: user.id,
    privacy_level: 'public'
  });

  revalidatePath('/');
  return { isToxic: false, success: true };
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
 * 6. プロフィール更新・通報
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
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = publicUrl;
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

  const { error } = await supabase.from('reports').insert({ 
    post_id: postId, 
    reporter_id: user.id,
    reason: '少し悲しくなった' // デフォルト理由
  });

  if (!error) {
    // 管理画面を最新にする
    revalidatePath('/admin/dashboard');
    return { success: true };
  }
  return { success: false };
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
  revalidatePath('/admin/dashboard'); // 管理画面からも消えるように
  if (user) revalidatePath(`/users/${user.id}`);
}

export async function getReportedPosts() {
  const supabase: any = await createClient() 

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      posts (
        content,
        image_url,
        video_url,
        authorProfile:profiles!user_id(full_name, avatar_url)
      ),
      reporterProfile:profiles!reporter_id(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch reports error:', error.message)
    return []
  }

  return data
}