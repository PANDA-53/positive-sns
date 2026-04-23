"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const USERS = [
  { id: 1, name: "パンダ", avatar: "🐼" },
  { id: 2, name: "ネコ", avatar: "🐱" },
  { id: 3, name: "イヌ", avatar: "🐶" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  // 修正ポイント：返信先の投稿IDを保存する状態
  const [replyTo, setReplyTo] = useState<any>(null);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: true }); // 返信を並べやすくするため昇順で取得

    if (!error && data) {
      setPosts(data);
    }
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          fetchPosts(); // 返信構造を正しく保つため、全体を再取得
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePost = async () => {
    if (!inputText.trim()) return;

    const { error } = await supabase.from("posts").insert([
      {
        content: inputText,
        user_name: selectedUser.name,
        avatar_url: selectedUser.avatar,
        parent_id: replyTo ? replyTo.id : null, // 修正ポイント：返信先のIDをセット
      },
    ]);

    if (error) {
      alert("投稿に失敗しました。");
      console.error(error);
    } else {
      setInputText("");
      setReplyTo(null); // 投稿後は返信モードを解除
      fetchPosts();
    }
  };

  // メインの投稿（parent_id が null のもの）だけを取り出す
  const mainPosts = posts.filter(post => !post.parent_id);

  return (
    <main className="max-w-2xl mx-auto p-4 bg-orange-50 min-h-screen">
      <h1 className="text-2xl font-bold text-orange-600 mb-6 text-center">🌻 ポジティブSNS 🌻</h1>
      
      <div className="flex gap-2 mb-4 justify-center">
        {USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`p-2 rounded-full border-2 transition ${
              selectedUser.id === user.id ? "border-orange-500 bg-orange-100" : "border-transparent bg-white shadow-sm"
            }`}
          >
            {user.avatar} {user.name}
          </button>
        ))}
      </div>

      {/* 投稿フォーム */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-8">
        {replyTo && (
          <div className="flex justify-between items-center mb-2 bg-gray-100 p-2 rounded text-sm">
            <span>@{replyTo.user_name} さんへ返信中</span>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 underline">キャンセル</button>
          </div>
        )}
        <textarea
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-black"
          placeholder={replyTo ? "返信を書こう！" : "今のポジティブな気持ちは？"}
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          onClick={handlePost}
          className={`mt-2 w-full py-2 rounded-lg font-bold transition shadow-md ${
            replyTo ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600"
          } text-white`}
        >
          {replyTo ? "返信する" : "投稿する"}
        </button>
      </div>

      {/* 投稿一覧 */}
      <div className="space-y-6">
        {mainPosts.length === 0 && (
          <p className="text-center text-gray-500">まだ投稿がありません。</p>
        )}
        {/* メイン投稿をループ */}
        {[...mainPosts].reverse().map((post) => (
          <div key={post.id} className="space-y-2">
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{post.avatar_url}</span>
                <span className="font-bold text-gray-700">{post.user_name}</span>
                <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString("ja-JP")}</span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              <button 
                onClick={() => setReplyTo(post)}
                className="mt-2 text-xs text-blue-500 font-bold hover:underline"
              >
                返信する
              </button>
            </div>

            {/* この投稿への返信を表示 */}
            {posts
              .filter(reply => reply.parent_id === post.id)
              .map(reply => (
                <div key={reply.id} className="ml-8 bg-white/60 p-3 rounded-lg border-l-2 border-blue-300 text-sm shadow-inner">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{reply.avatar_url}</span>
                    <span className="font-bold">{reply.user_name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleString("ja-JP")}</span>
                  </div>
                  <p className="text-gray-700">{reply.content}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}