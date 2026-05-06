"use client";

import React, { useState, useTransition } from "react";
import { createReply } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ReplyForm({ parentId, onSuccess }: { parentId: number; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("parentId", parentId.toString());

    startTransition(async () => {
      // 1. サーバーアクションの実行を待つ
      const result = await createReply(formData);

      if (result.success) {
        setContent("");
        // 2. クライアント側のルーター状態を更新
        router.refresh(); 
        
        // 3. 親コンポーネントの handlePostSuccess を実行
        if (onSuccess) {
          await onSuccess(); 
        }
        
        toast.success("返信しました");
      } else if (result.isToxic) {
        toast.error("内容を調整してみましょう");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 bg-gray-50 rounded-2xl text-[13px] outline-none border border-transparent focus:border-gray-200 transition-all text-black"
        placeholder="優しい返信を送りましょう"
        rows={2}
        disabled={isPending}
        required
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="bg-black text-white px-5 py-2 rounded-full text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
        >
          {isPending ? "送信中..." : "Reply"}
        </button>
      </div>
    </form>
  );
}