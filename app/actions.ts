"use server";

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import OpenAI from 'openai';
import webpush from 'web-push';

// フロント側の型エラーを根絶するため、共通の戻り値型を定義
export interface PostResult {
  isToxic: boolean;
  reason: string;
  suggestions: string[];
  success: boolean;
  errorType?: string;
  error?: string;
}

interface CreateNotificationParams {
  userId: string;
  notifierId: string;
  type: 'awesome' | 'hug' | 'reply' | 'dm';
  postId?: number;
  dmMessageId?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// VAPID設定
webpush.setVapidDetails(
  'mailto:ikuya.gima@verysmile.jp', 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * 🛠️ Supabaseの通知テーブル(notifications)へレコードを挿入する内部関数
 */
export async function createNotification({
  userId,
  notifierId,
  type,
  postId,
  dmMessageId
}: CreateNotificationParams) {
  // 自分の行動に対する通知は作成しない
  if (userId === notifierId) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      notifier_id: notifierId,
      type,
      post_id: postId,
      dm_message_id: dmMessageId,
      is_read: false
    });

  if (error) {
    console.error('通知テーブルへのインサートに失敗しました:', error.message);
  }
}

/**
 * 指定したユーザーに通知を飛ばす関数（WebPush）
 */
async function sendNotificationToUser(userId: string, title: string, body: string, url: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_subscription')
    .eq('id', userId)
    .single();

  if (profile?.push_subscription) {
    try {
      await webpush.sendNotification(
        profile.push_subscription as any,
        JSON.stringify({ title, body, url })
      );
    } catch (error: any) {
      console.error('Push通知送信失敗:', error);
      if (error.statusCode === 410) {
        await supabase.from('profiles').update({ push_subscription: null }).eq('id', userId);
      }
    }
  }
}

/**
 * SNS「POSITIVES」モデレーター判定ロジック
 */
async function checkAndSuggestContent(content: string): Promise<Omit<PostResult, "success">> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはSNS「POSITIVES」の守護聖人であり、卓越した言葉の錬金術師です。
あなたの使命は、投稿から「毒」を抜き、ユーザーの「本音」を誰も傷つかない「輝き」に変えることです。

【判定基準：基本ルール】
・TOXIC（即書き書き書き換え対象）：
  - 攻撃の矛先が「外（他者・社会・特定の誰か）」に向いているもの。
  - 否定的な断定（「〜はダメだ」「〜すべきでない」）。
  - 文脈に潜む「皮肉」や「冷笑」。
  - 負のエネルギーを伝染させる強い言葉。

・SAFE（受け入れ）：
  - 矛先が「内（自分）」に向いている弱音、悲しみ、後悔。
  - 喜び、感謝、些浅な幸せの共有。

【出力ルール】
1. SAFEの場合： "SAFE" とのみ出力。
2. TOXICの場合： 以下の形式で案を３つ出力。
    NG | 理由 | 案1 | 案2 | 案3

文末のニュアンス：
案1：寄り添い（癒やし系）
案2：内省（クール・自分軸）
案3：変換（ポジティブ・ユーモア）
「〜しましょう」というアドバイス形式は禁止。ユーザーがそのまま投稿ボタンを押して使える「独り言」のみを出力すること。

【投稿とリプライで判定方法、出力方法を変してください】
投稿時：
1.基本の判定基準に準ずる。

リプライ時：
1.投稿時の判定基準に加え、返信先の文脈を考慮した判定を行う。例えば、返信先がネガティブな内容であっても、ユーザーの返信が自己反省や共感を示すものであればSAFEと判定するなど、より柔軟な判断を行うこと。

3.投稿内容に共感や寄り添いを示すリプライに関しては表現が多少過剰であっても許可する傾向にすること。`
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
      const parts = result
        .split(/[|\n]/)
        .map(s => s.trim().replace(/^["「'・\-]|["」']$/g, ''))
        .filter(Boolean);

      const cleanSuggestions = parts.filter(text => {
        if (!text) return false;
        if (/^[\-\*\=\_~:\s]{2,}$/.test(text)) return false; 
        if (/^(案\d+|NG|理由|判定|TOXIC|変換|内省|寄り添い)/i.test(text)) return false;
        if (text === content || text === `"${content}"`) return false;
        return true;
      });

      const reason = parts.find(p => p.includes("ため") || p.includes("可能性") || p.includes("表現")) || "規約に抵触する可能性があります";

      const finalSuggestions = cleanSuggestions
        .filter(s => s !== reason)
        .slice(0, 3);

      return { 
        isToxic: true, 
        reason: reason, 
        suggestions: finalSuggestions 
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
  try {
    const supabase = await createClient();
    
    const [postsRes, friendshipsRes] = await Promise.all([
      supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
      supabase.from('friendships').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    ]);

    if (postsRes.error || friendshipsRes.error) {
      return { mainPosts: [], replies: [], friendIds: [], pendingRequests: [], acceptedFriends: [] };
    }

    const posts = postsRes.data || [];
    const friendshipsRaw = friendshipsRes.data || [];

    const postUserIds = posts.map(p => p.user_id);
    const friendUserIds = friendshipsRaw.map(f => (f.user_id === userId ? f.friend_id : f.user_id));
    const allRelevantIds = Array.from(new Set([...postUserIds, ...friendUserIds, userId])).filter(Boolean);

    const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', allRelevantIds);

    let profileAwesomeMap = new Map<string, number>();
    
    if (allRelevantIds.length > 0) {
      const { data: allUserPosts } = await supabase.from('posts').select('id, user_id').in('user_id', allRelevantIds);
      const allPostIds = allUserPosts?.map(p => p.id) || [];
      const postToUserMap = new Map(allUserPosts?.map(p => [p.id, p.user_id]));

      if (allPostIds.length > 0) {
        const { data: allAwesomeReactions } = await supabase
          .from('reactions')
          .select('post_id')
          .eq('type', 'awesome')
          .in('post_id', allPostIds);

        allAwesomeReactions?.forEach(r => {
          const authorId = postToUserMap.get(r.post_id);
          if (authorId) {
            profileAwesomeMap.set(authorId, (profileAwesomeMap.get(authorId) || 0) + 1);
          }
        });
      }
    }

    const enrichedProfiles = allProfiles?.map(prof => ({
      ...prof,
      totalAwesome: profileAwesomeMap.get(prof.id) || 0
    })) || [];

    const friendMap = new Map();
    friendshipsRaw
      .filter(f => f.status === 'accepted')
      .forEach(f => {
        const fid = f.user_id === userId ? f.friend_id : f.user_id;
        const profile = enrichedProfiles.find(p => p.id === fid);
        if (profile) friendMap.set(fid, profile);
      });
    
    const acceptedFriends = Array.from(friendMap.values());

    const pendingRequests = friendshipsRaw
      .filter(f => f.friend_id === userId && f.status === 'pending')
      .map(f => ({
        user_id: f.user_id,
        sender_profile: enrichedProfiles.find(p => p.id === f.user_id)
      }))
      .filter(req => req.sender_profile);

    const formattedPosts = posts.map(post => ({
      ...post,
      authorProfile: enrichedProfiles.find(p => p.id === post.user_id) || { full_name: '匿名', avatar_url: '', totalAwesome: 0 },
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
  } catch (error) {
    console.error("fetchMainTimelineData Error:", error);
    return { mainPosts: [], replies: [], friendIds: [], pendingRequests: [], acceptedFriends: [] };
  }
}

/**
 * 3. プロフィールデータの取得
 * 💡 戻り値の型定義を100%厳格化してフロントエンドのエラーを根絶
 */
export async function fetchUserProfileData(targetUserId: string, currentUserId: string): Promise<{
  profile: any;
  mainPosts: any[];
  friendship: any;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  isMe: boolean;
  totalAwesomeCount: number;
  error: any;
}> {
  const supabase = await createClient();
  const cleanTargetId = targetUserId.trim();

  const { data: userPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', cleanTargetId);

  const postIds = userPosts?.map(p => p.id) || [];

  const [profileRes, postsRes, friendshipRes, allReactionsRes, awesomeRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', cleanTargetId).single(),
    supabase.from('posts').select('*').eq('user_id', cleanTargetId).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`and(user_id.eq.${currentUserId},friend_id.eq.${cleanTargetId}),and(user_id.eq.${cleanTargetId},friend_id.eq.${currentUserId})`).maybeSingle(),
    supabase.from('reactions').select('*'),
    
    postIds.length > 0 
      ? supabase.from('reactions').select('id').eq('type', 'awesome').in('post_id', postIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const posts = postsRes.data || [];
  const reactions = allReactionsRes.data || [];
  const totalAwesomeCount = awesomeRes.data?.length || 0;
  const friendship = friendshipRes.data;

  // 💡 友達状態の動的な文字列パース処理を確実に行う
  let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
  if (friendship) {
    if (friendship.status === 'accepted') {
      friendshipStatus = 'accepted';
    } else if (friendship.status === 'pending') {
      friendshipStatus = friendship.user_id === currentUserId ? 'pending_sent' : 'pending_received';
    }
  }

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
    friendship,
    friendshipStatus, // 💡 ここが確実に4パターンの文字列型であることをTypeScriptに保証
    isMe: cleanTargetId === currentUserId, 
    totalAwesomeCount, 
    error: profileRes.error
  };
}

/**
 * 4. 投稿・リプライ作成
 */
export async function createPost(formData: FormData): Promise<PostResult> {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parent_id') ? parseInt(formData.get('parent_id') as string) : null;
  const privacyLevel = (formData.get('privacy_level') as string) || 'public';
  const file = formData.get('media') instanceof File ? (formData.get('media') as File) : null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content', success: false };

  let imageUrl = null;
  let videoUrl = null;

  if (file && file.size > 0 && file.name !== 'undefined') {
    const isVideo = file.type.startsWith('video/');
    const bucketName = isVideo ? 'videos' : 'post_images';
    const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      if (isVideo) {
        videoUrl = publicUrl;
      } else {
        imageUrl = publicUrl;
      }
    }
  }

  // .select().single() で作成されたデータを確実に取得
  const { data: insertedPost, error: insertError } = await supabase
    .from('posts')
    .insert({ 
      content, 
      user_id: user.id, 
      privacy_level: privacyLevel,
      image_url: imageUrl,
      video_url: videoUrl,
      parent_id: parentId 
    })
    .select()
    .single();

  // 💡 エラーハンドリングを厳格にして型を保証
  if (insertError || !insertedPost) {
    return { isToxic: false, reason: "", suggestions: [], success: false, error: "DB保存失敗" };
  }

  if (parentId) {
    const { data: parentPost } = await supabase.from('posts').select('user_id').eq('id', parentId).single();
    if (parentPost && parentPost.user_id !== user.id) {
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      
      // 1. WebPush通知
      await sendNotificationToUser(parentPost.user_id, "新しい返信", `${myProfile?.full_name || '誰か'}さんから返信が届きました`, `/`);
      
      // 2. アプリ内通知データの保存（今作ったリプライ自身のIDを指定）
      await createNotification({
        userId: parentPost.user_id,
        notifierId: user.id,
        type: 'reply',
        postId: insertedPost.id 
      });
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');
  revalidatePath('/notifications');
  return { isToxic: false, reason: "", suggestions: [], success: true };
}

export async function createReply(formData: FormData): Promise<PostResult> {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string; 
  const { data: { user } } = await supabase.auth.getUser();
  
  // 💡 ユーザーがいない場合に確実に PostResult 型を返してエラーを防ぐ
  if (!user) {
    return { success: false, isToxic: false, reason: "認証エラー", suggestions: [] };
  }

  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, success: false };

  // .select().single() で作成されたリプライデータを取得
  const { data: insertedReply, error: insertError } = await supabase
    .from('posts')
    .insert({ 
      content, 
      parent_id: parseInt(parentId), 
      user_id: user.id,
      privacy_level: 'public'
    })
    .select()
    .single();

  // 💡 インサート失敗時も確実に PostResult 型をリターンさせて分岐の漏れを無くす
  if (insertError || !insertedReply) {
    return { success: false, isToxic: false, reason: "コメントの保存に失敗しました", suggestions: [] };
  }

  const { data: parentPost } = await supabase.from('posts').select('user_id').eq('id', parseInt(parentId)).single();
  if (parentPost && parentPost.user_id !== user.id) {
    const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    
    // 1. WebPush通知
    await sendNotificationToUser(parentPost.user_id, "返信", `${myProfile?.full_name || '誰か'}さんから返信が届きました`, `/`);
    
    // 2. アプリ内通知データの保存（今作ったリプライ自身のIDを指定）
    await createNotification({
      userId: parentPost.user_id,
      notifierId: user.id,
      type: 'reply',
      postId: insertedReply.id
    });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');
  revalidatePath('/notifications');
  return { success: true, isToxic: false, reason: "", suggestions: [] };
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
  revalidatePath('/');
}

export async function deleteFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('friendships').delete().or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);
  
  revalidatePath(`/users/${targetUserId}`);
  revalidatePath('/');
}

export async function acceptFriendRequest(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !requesterId) return;
  
  await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requesterId)
    .eq('friend_id', user.id);
  
  revalidatePath(`/users/${requesterId}`);
  revalidatePath('/');
}

/**
 * 6. プロフィール更新・通報
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '認証エラー' };

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

  const { error: upsertError } = await supabase.from('profiles').upsert({ 
    id: user.id, 
    full_name: fullName, 
    bio: bio, 
    avatar_url: avatarUrl, 
    updated_at: new Date().toISOString() 
  });

  if (upsertError) {
    console.error("Profile Update Error:", upsertError);
    return { error: 'DB更新失敗' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/notifications');
  revalidatePath('/');

  // 念のため、結果にuserIdを含めて返しておくとフロント側の遷移がより確実になります
  return { success: true, userId: user.id };
}

export async function updatePushSubscription(subscriptionJson: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ push_subscription: JSON.parse(subscriptionJson) }).eq('id', user.id);
  revalidatePath('/', 'layout');
}

export async function reportPost(postId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "ログインが必要です" };

  const { error } = await supabase.from('reports').insert({ post_id: postId, reporter_id: user.id, reason: '少し悲しくなった' });
  if (!error) {
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
  
  if (existing) { 
    await supabase.from('reactions').delete().eq('id', existing.id); 
  } else { 
    await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type: reactionType }); 

    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id !== user.id) {
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const icon = reactionType === 'awesome' ? '✨' : '🫂';
      
      // 1. WebPush通知
      await sendNotificationToUser(post.user_id, `${icon} リアクション`, `${myProfile?.full_name || '誰か'}さんがリアクションしました`, `/`);
      
      // 🛠️ 2. アプリ内通知データの保存
      await createNotification({
        userId: post.user_id,
        notifierId: user.id,
        type: reactionType,
        postId: postId
      });
    }
  }
  revalidatePath('/');
  revalidatePath('/notifications');
}

export async function deletePost(formData: FormData) {
  const postId = formData.get('postId') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('posts').delete().eq('id', postId);
  revalidatePath('/');
  revalidatePath('/admin/dashboard'); 
  if (user) revalidatePath(`/users/${user.id}`);
}

export async function getReportedPosts() {
  const supabase: any = await createClient() 
  const { data, error } = await supabase
    .from('reports')
    .select(`*, posts (content, image_url, video_url, authorProfile:profiles!user_id(full_name, avatar_url)), reporterProfile:profiles!reporter_id(full_name)`)
    .order('created_at', { ascending: false })

  if (error) return [];
  return data;
}

export async function reportReply(replyId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "ログインが必要です" };

  const { error } = await supabase.from('reports').insert({ post_id: replyId, reporter_id: user.id, reason: 'コメントエリアで少し悲しくなった' });
  if (!error) {
    revalidatePath('/');
    revalidatePath('/admin/dashboard'); 
    return { success: true };
  }
  return { success: false };
}

/**
 * 8. DM（ダイレクトメッセージ）機能
 */
export async function fetchDirectMessages(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("DM取得失敗:", error);
    return [];
  }
  return data;
}

export async function sendDirectMessage(receiverId: string, message: string): Promise<PostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !message.trim()) return { success: false, isToxic: false, reason: "", suggestions: [] };

  const moderatorResult = await checkAndSuggestContent(message);
  if (moderatorResult.isToxic) {
    return { ...moderatorResult, errorType: 'toxic-content', success: false };
  }

  const { data: insertedMsg, error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message: message.trim()
    })
    .select()
    .single();

  if (error || !insertedMsg) {
    console.error("DM送信失敗:", error);
    return { success: false, isToxic: false, reason: "", suggestions: [] };
  }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  await sendNotificationToUser(
    receiverId,
    `📩 ${myProfile?.full_name || '誰か'}さんからのメッセージ`,
    message.length > 20 ? `${message.substring(0, 20)}...` : message,
    `/messages/${user.id}`
  );

  await createNotification({
    userId: receiverId,
    notifierId: user.id,
    type: 'dm',
    dmMessageId: insertedMsg.id
  });
  revalidatePath('/messages');
  revalidatePath(`/messages/${user.id}`);
  revalidatePath('/notifications'); // DM通知用

  return { success: true, isToxic: false, reason: "", suggestions: [] };
}

export async function fetchChatHistoryList() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const currentUserId = user.id;

  const { data: messages, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id, message, created_at')
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order('created_at', { ascending: false });

  if (error || !messages) {
    console.error("Error fetching chat list:", error);
    return [];
  }

  const latestMessagesMap = new Map<string, any>();

  for (const msg of messages) {
    const targetUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;

    if (!latestMessagesMap.has(targetUserId)) {
      latestMessagesMap.set(targetUserId, msg);
    }
  }

  const chatList = [];
  for (const [targetUserId, latestMsg] of latestMessagesMap.entries()) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', targetUserId)
      .single();

    chatList.push({
      targetUserId,
      latestMessage: latestMsg.message,
      createdAt: latestMsg.created_at,
      targetName: profile?.full_name || "ユーザー",
      avatarUrl: profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"
    });
  }

  return chatList;
}