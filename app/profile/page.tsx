"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ProfilePage() {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // すでに登録されているプロフィールを取得
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
        }
      }
      setLoading(false);
    }
    getProfile();
  }, [supabase]);

  async function updateProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) alert("更新に失敗しました");
    else alert("プロフィールを更新しました！");
  }

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">プロフィール設定</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm">名前</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">アイコンURL（とりあえず画像URL）</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </div>
        <button
          onClick={updateProfile}
          className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
        >
          保存する
        </button>
      </div>
    </div>
  );
}