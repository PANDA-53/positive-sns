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
・単語の置き換えではなく、文章全体の「内容（何があったか）」を維持したまま、棘のない「内省・独り言」にリライトしてください。
・言い換え案のボリュームは、元の入力文の長さに合わせて調整してください（短文には短文、長文には長文を）。
・"" や「言い換え案」という言葉は一切含めないでください。
・一人称は投稿内容のまま、二人称が攻撃的または差別的である場合は「あなた」としてください。
・そのまま投稿ボタンを押して使える「ユーザー自身の独り言（セリフ）」のみを出力してください。
・文体は「〜だなぁ」「〜かも」「〜かな？」など、SNSで自然な話し言葉にしてください。

例
入力：「昨日の会議で部長にみんなの前でボロクソに怒鳴られて本当にムカつく。あんな言い方ないと思う。もう顔も見たくないし会社辞めたい。」
出力：
NG | 強い怒りや攻撃的な表現が含まれています | 昨日の会議は厳しい指摘が多くて、正直心が折れそうになっちゃった。もう少し穏やかなコミュニケーションができればいいんだけど、今は少し距離を置いて心を落ち着かせたいな。 | みんなの前で強く言われてしまったことが、まだショックで引きずってるかも。今はモヤモヤするけど、自分の居場所を大切にするために、まずはゆっくり休んで気持ちを整理したいなぁ。 | 納得いかない言い方をされると、どうしても反発したくなる自分がいる。そんな環境にいるのは辛いけど、これからはもっと自分らしく働ける方法を前向きに考えてみようかな。`
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
  const privacyLevel = (formData.get('privacy_level') as string) || 'public'; // 公開範囲を取得
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // AIによるテキスト判定
  const result = await checkAndSuggestContent(content);
  if (result.isToxic) return { ...result, errorType: 'toxic-content' };

  let imageUrl = null;
  let videoUrl = null;

  // 動画のアップロード処理
  if (videoFile && videoFile.size > 0 && videoFile.name !== 'undefined') {
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, videoFile);
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName);
      videoUrl = publicUrl;
    } else {
      console.error("動画アップロードエラー:", uploadError);
    }
  }

  // 画像のアップロード処理
  if (!videoUrl && imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, imageFile);
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  // DB保存 (privacy_levelを追加)
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

// --- 返信作成 (ReplyForm連携用) ---
export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const content = formData.get('content') as string;
  const parentId = formData.get('parentId') as string;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isToxic: false };

  const result = await checkAndSuggestContent(content);
  
  if (result.isToxic) {
    return { 
      isToxic: true, 
      reason: result.reason, 
      suggestions: result.suggestions 
    };
  }

  await supabase.from('posts').insert({ content, parent_id: parentId, user_id: user.id });
  revalidatePath('/');
  return { isToxic: false };
}

// --- フレンド・削除・リアクション ---

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

  const { error } = await supabase.from('reports').insert({
    post_id: postId,
    reporter_id: user.id
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: "既に報告済みです" };
    }
    return { success: false, message: "エラーが発生しました" };
  }

  return { success: true };
}

// --- ユーザー検索用アクション ---
export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${query}%`)
    .neq('id', currentUser.id) // 自分自身は除外
    .limit(20);

  if (error) {
    console.error("検索エラー:", error);
    return [];
  }
  return data;
}

// --- 友達申請の取り消し・解除 (既存のdeleteFriendshipを強化) ---
export async function cancelFriendship(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 自分が送った、または相手から送られた申請を削除
  await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);

  revalidatePath('/');
}