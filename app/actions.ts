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

【思考プロセス（思考の出力は不要）】
1. ユーザーが本当に伝えたかった「感情の種」は何か？（怒り？ 悲しみ？ 疎外感？）
2. その「種」を維持したまま、主語を「自分」に固定し、独白（モノローグ）の形式に変換できるか。
3. 読み手が「この人も大変なんだな」と共感し、応援したくなる形に昇華させる。

【出力ルール】
1. SAFEの場合： "SAFE" とのみ出力。
2. TOXICの場合： 以下の形式で出力。
    NG | ユーザーを傷つけない「納得感のある理由」 | 言い換え案1 | 言い換え案2 | 言い換え案3

【言い換え案作成の極意】
・アドバイス（〜しましょう）ではなく、ユーザーの「心の声」として出力。
・「怒り」を「戸惑い」や「自分への問いかけ」に変換する。
・SNSの空気感に馴染む、柔らかい語尾（「〜だなぁ」「〜かもね」「〜ってこともあるかな」）。あなたはSNS「POSITIVES」のモデレーター兼、優秀なリライトエディターです。以下の厳格な基準に従って投稿を判定し、不適切な場合はユーザーを導いてください。

【判定基準】

TOXIC（投稿禁止）:

他者への誹謗中傷、攻撃的発言、差別、偏見。

他者の投稿を否定するコメント。

「死ね」「うざい」等の隠語、または否定的感情を直接ぶつける言葉。

「嫌い」「ダサい」など、他者を不快にする主観的な否定的意見。

SAFE（許可）:

ポジティブな内容、感謝、日々の発見。

自責や後悔（「自分はダメだ」等）は、他者を攻撃していないためSAFEと判定。

【出力ルール】

SAFEの場合： "SAFE" とのみ出力。

TOXICの場合： 必ず以下の形式（パイプ区切り）で出力してください。
NG | 理由 | 案1：寄り添い | 案2：内省 | 案3：変換

【言い換え案作成の3つの性格】
絵文字は一切使用せず、文末のニュアンスだけで以下の3つの人格を表現してください。

案1：寄り添い（癒やし系）
ユーザーのストレスや疲れを包み込み、共感を示す口調。「〜だよね」「〜かもしれないね」といった、隣で話を聞いているような柔らかい表現。

案2：内省（クール・自分軸）
外部への不満を「自分の感覚の問題」として静かに受け止める口調。「私には合わないかな」「今はこういう気分なんだ」といった、自立した大人の独白表現。

案3：変換（ポジティブ・ユーモア）
嫌な出来事を「学び」や「ネタ」として捉え直す、少し前向きな口調。「次はこうしてみよう」「これもある意味、貴重な経験だなぁ」といった、視点を変えた表現。

【重要ルール】

「〜しましょう」というアドバイス形式は禁止。

ユーザーがそのまま投稿ボタンを押して使える「独り言」のみを出力すること。

文体はSNSで自然な話し言葉（「〜だなぁ」「〜かも」「〜かな」）を徹底すること。
案１、２などの表記は不要で、単に言い換え案を３つ列挙してください。`
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
 * 4. 投稿・返信作成
 */
export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const privacyLevel = (formData.get('privacy_level') as string) || 'public';
  
  // PostFormの修正に合わせ、両方 'image' という名前で来る可能性も考慮して取得
  const imageFile = formData.get('image') as File | null;
  const videoFile = formData.get('video') as File | null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // AIによる投稿内容チェック
  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content' };

  let imageUrl = null;
  let videoUrl = null;

  // --- 画像アップロード処理 ---
  // name !== 'undefined' のチェックを外し、ファイルが存在するかどうかで判定
  if (imageFile && imageFile.size > 0) {
    // 圧縮などで名前が消えている場合に備え、デフォルトの拡張子を fallback
    const rawName = imageFile.name || "";
    const fileExt = rawName.includes('.') ? rawName.split('.').pop() : 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post_images') 
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    } else {
      console.error("Image upload error details:", uploadError);
    }
  }

  // --- 動画アップロード処理 ---
  if (videoFile && videoFile.size > 0) {
    const rawName = videoFile.name || "";
    const fileExt = rawName.includes('.') ? rawName.split('.').pop() : 'mp4';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos') 
      .upload(fileName, videoFile);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);
      videoUrl = publicUrl;
    } else {
      console.error("Video upload error details:", uploadError);
    }
  }

  // データベースへの挿入
  const { error: insertError } = await supabase.from('posts').insert({ 
    content, 
    user_id: user.id, 
    privacy_level: privacyLevel,
    image_url: imageUrl,
    video_url: videoUrl
  });

  if (insertError) {
    console.error("Database insert error:", insertError.message);
    return { isToxic: false, error: "DB保存失敗" };
  }

  revalidatePath('/');
  revalidatePath(`/users/${user.id}`);
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
/**
 * 2. メインタイムライン用データ取得 (キャッシュ・重複・型エラー対策版)
 */
export async function fetchMainTimelineData(userId: string) {
  const supabase = await createClient();
  
  // 1. 投稿と友情関係を並列で取得
  const [postsRes, friendshipsRes] = await Promise.all([
    supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  ]);

  const posts = postsRes.data || [];
  const friendshipsRaw = friendshipsRes.data || [];

  // 2. 関連する全ユーザーIDを抽出してプロフィールを一括取得
  const postUserIds = posts.map(p => p.user_id);
  const friendUserIds = friendshipsRaw.map(f => (f.user_id === userId ? f.friend_id : f.user_id));
  const allRelevantIds = Array.from(new Set([...postUserIds, ...friendUserIds, userId])).filter(Boolean);

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', allRelevantIds);

  // --- 3. 友情関係の重複を Map で物理的に排除 (image_e728e0.png の対策) ---
  const friendMap = new Map();
  
  friendshipsRaw
    .filter(f => f.status === 'accepted')
    .forEach(f => {
      // 自分じゃない方のIDを特定
      const fid = f.user_id === userId ? f.friend_id : f.user_id;
      const profile = allProfiles?.find(p => p.id === fid);
      // Mapはキーが重複しないため、同じユーザーは1人分に集約される
      if (profile) friendMap.set(fid, profile);
    });
  
  const acceptedFriends = Array.from(friendMap.values());

  // 4. 申請中リストの整理
  const pendingRequests = friendshipsRaw
    .filter(f => f.friend_id === userId && f.status === 'pending')
    .map(f => ({
      user_id: f.user_id,
      sender_profile: allProfiles?.find(p => p.id === f.user_id)
    }))
    .filter(req => req.sender_profile);

  // 5. 投稿データの整形
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
    // --- 6. 型アサーションで f.id の赤線を解消 (image_e78a96.png の対策) ---
    friendIds: Array.from(friendMap.keys()) as string[], 
    pendingRequests,
    acceptedFriends
  };
}
