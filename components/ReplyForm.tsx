"use client";

import React, { useState, useTransition } from "react";
import { createPost } from "@/app/actions"; // createPostがリプライも兼ねている前提
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PostResult {
  isToxic?: boolean;
  suggestions?: string[];
  success?: boolean;
}

const GOLD_COLOR = "#B8860B";

export default function ReplyForm({ parentId, onSuccess }: { parentId: number; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toxicInfo, setToxicInfo] = useState<{ isToxic: boolean; suggestions: string[] }>({
    isToxic: false,
    suggestions: [],
  });
  const router = useRouter();

  // 🛠️ 入力内容と言い換え案をすべて初期化する処理
  const handleReset = () => {
    setContent("");
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText);
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("parent_id", parentId.toString()); // PostFormに合わせてparent_id

    startTransition(async () => {
      try {
        const result = (await createPost(formData)) as PostResult;

        if (result && result.isToxic) {
          setToxicInfo({ isToxic: true, suggestions: result.suggestions || [] });
          toast.warning("その言葉を伝えたら、貴方は笑顔になれますか");
          return;
        }

        if (result.success) {
          handleReset();
          toast.success("返信しました");

          // 🛠️ データベースの最新状態を確実に反映しタイムラインを更新するため、画面をリロード
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(); 
            }
            window.location.reload();
          }, 300);
        }
      } catch (error) {
        toast.error("エラーが発生しました");
      }
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {/* 言い換え案の表示：PostFormのデザインを継承 */}
      {toxicInfo.isToxic && (
        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-3 rounded-2xl animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] font-bold text-amber-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
            今は他の好きな投稿に目を向けませんか？
          </p>
          <div className="flex flex-col gap-1.5">
            {toxicInfo.suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(text)}
                className="text-left text-[11px] bg-white hover:bg-amber-50 border border-amber-100 p-2 rounded-xl transition-all text-gray-700 shadow-sm"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full p-3 rounded-2xl text-[16px] outline-none border transition-all ${
            toxicInfo.isToxic ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-transparent focus:border-gray-200"
          } text-black`}
          placeholder="優しい返信を送りましょう"
          rows={2}
          disabled={isPending}
          required
        />
        
        {/* 🛠️ ボタンエリア：RESETボタンを追加し、横並び（flex-row）で美しく配置 */}
        <div className="flex flex-row justify-end items-center gap-4 mt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="text-[9px] font-black transition-colors uppercase tracking-[0.15em] disabled:opacity-30 select-none"
            style={{ color: GOLD_COLOR }}
          >
            RESET
          </button>

          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
              toxicInfo.isToxic ? "bg-amber-500 text-white" : "bg-black text-white disabled:opacity-30"
            }`}
          >
            {isPending ? "..." : toxicInfo.isToxic ? "Rewrite" : "Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}