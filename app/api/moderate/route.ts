import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 無料枠のGemini API（Google AI Studio）を使用
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Supabaseのサービスロールキー（管理権限でファイルを削除するために必要）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // SupabaseのWebhookから届くデータ構造をパース
    const record = body.record;
    if (!record) return NextResponse.json({ message: "No record found" }, { status: 400 });

    const bucketId = record.bucket_id; // 例: "posts"
    const filePath = record.name;      // 例: "user_123/image.jpg"
    const mimeType = record.metadata?.mimetype || "image/jpeg";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. アップロードされた画像/動画ファイルをダウンロード
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketId)
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("ファイルダウンロード失敗:", downloadError);
      return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }

    // 2. データをBase64に変換
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 3. Gemini APIへ厳格な審査を依頼
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "これはSNSに投稿された画像・動画です。学校でのいじめ、特定の個人をからかう・晒し上げる意図、プライバシーを侵害する個人情報の写り込み（テストの点数、名札など）、暴力的な表現、嫌がらせが含まれているか厳格にチェックしてください。不適切と判断した場合は必ず冒頭に『REJECT』、安全な場合は『ALLOW』と1語のみで出力し、その後に理由を述べてください。" },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log(`[AIモデレーション判定]: ${filePath} -> ${aiResponse}`);

    // 4. 【有害判定】もし結果に『REJECT』が含まれていたら即座に削除！
    if (aiResponse.toUpperCase().includes("REJECT")) {
      console.warn(`🚨 有害コンテンツを検知！自動削除を実行します: ${filePath}`);
      
      // Storageからファイルを物理削除
      const { error: removeError } = await supabase.storage
        .from(bucketId)
        .remove([filePath]);

      if (removeError) console.error("Storageからの削除に失敗:", removeError);

      // (オプション) もしpostsテーブル等にレコードを作っているなら、ここで削除か非表示(is_hidden = true)にする
      // await supabase.from('posts').update({ is_hidden: true }).eq('image_url', filePath);

      return NextResponse.json({ moderated: true, status: "REJECTED_AND_DELETED" });
    }

    return NextResponse.json({ moderated: true, status: "ALLOWED" });

  } catch (error: any) {
    console.error("モデレーションエラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
