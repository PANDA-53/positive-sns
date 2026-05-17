"use client";

import React, { useState, useRef, useTransition } from "react";
import { createReply } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Image, Video, X } from "lucide-react";

interface PostResult {
  isToxic?: boolean;
  suggestions?: string[];
  success?: boolean;
}

// 💡 拡張：FilteredTimeline から渡される Props の型を定義
interface ReplyFormProps {
  parentId: number;
  onSuccess: () => void;
  replyTarget?: { id: number; name: string } | null; // 誰への返信か
  onCancelReply?: () => void; // 返信先をキャンセルする関数
}

const GOLD_COLOR = "#B8860B";

export default function ReplyForm({ 
  parentId, 
  onSuccess,
  replyTarget = null,
  onCancelReply
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toxicInfo, setToxicInfo] = useState<{ isToxic: boolean; suggestions: string[] }>({
    isToxic: false,
    suggestions: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setContent("");
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setToxicInfo({ isToxic: false, suggestions: [] });
    // リセット時に返信ターゲットもクリア
    if (onCancelReply) onCancelReply();
  };

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText);
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("parentId", parentId.toString());
    if (mediaFile) {
      formData.append("media", mediaFile);
    }
    
    // 💡 重要：もし特定の返信に対するアンカー（replyTarget）があれば、そのIDを付与する
    if (replyTarget) {
      formData.append("replyToId", replyTarget.id.toString());
    }

    startTransition(async () => {
      try {
        const result = (await createReply(formData)) as PostResult;

        if (result && result.isToxic) {
          setToxicInfo({ isToxic: true, suggestions: result.suggestions || [] });
          toast.warning("その言葉を伝えたら、貴方は笑顔になれますか");
          return;
        }

        if (result.success) {
          handleReset();
          toast.success("返信しました");

          setTimeout(() => {
            if (onSuccess) onSuccess();
            window.location.reload();
          }, 300);
        } else {
          toast.error("送信に失敗しました");
        }
      } catch (error) {
        toast.error("エラーが発生しました");
      }
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {/* 💡 追加：特定のユーザーへの返信中バッジ */}
      {replyTarget && (
        <div className="flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/70 dark:border-amber-900/40 rounded-xl px-3 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <span className="text-[11px] text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1">
            <span>@</span>
            <span className="underline decoration-wavy decoration-amber-500/40">{replyTarget.name}</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">さんに返信中</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 言い換え案エリア */}
      {toxicInfo.isToxic && (
        <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 border border-amber-100 dark:border-amber-900/40 p-3 rounded-2xl animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
            今は他の好きな投稿に目を向けませんか？
          </p>
          <div className="flex flex-col gap-1.5">
            {toxicInfo.suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(text)}
                className="text-left text-[11px] bg-white dark:bg-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 p-2 rounded-xl transition-all text-gray-700 dark:text-zinc-200 shadow-sm"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full p-3 pb-12 rounded-2xl text-[16px] outline-none border transition-all ${
              toxicInfo.isToxic 
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" 
                : "bg-gray-50 dark:bg-zinc-800/50 border-transparent focus:border-gray-200 dark:focus:border-zinc-700"
            } text-black dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500`}
            // 💡 返信中相手の名前をプレースホルダーにも反映
            placeholder={replyTarget ? `${replyTarget.name} さんへ優しいメッセージを...` : "優しい返信を送りましょう"}
            rows={2}
            disabled={isPending}
          />

          {/* 入力欄左下のメディア選択ボタン */}
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50"
              title="画像・動画を添付"
            >
              <Image size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        </div>

        {/* メディアプレビューエリア */}
        {mediaPreview && mediaFile && (
          <div className="relative inline-block max-w-[200px] rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">
            {mediaFile.type.startsWith("video/") ? (
              <video src={mediaPreview} className="max-h-[120px] w-auto object-cover" muted playsInline />
            ) : (
              <img src={mediaPreview} alt="Preview" className="max-h-[120px] w-auto object-cover" />
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        {/* ボタンエリア */}
        <div className="flex flex-row justify-end items-center gap-4 mt-1">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="text-[9px] font-black transition-colors uppercase tracking-[0.15em] disabled:opacity-30 select-none hover:opacity-80"
            style={{ color: GOLD_COLOR }}
          >
            RESET
          </button>

          <button
            type="submit"
            disabled={isPending || (!content.trim() && !mediaFile)}
            className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
              toxicInfo.isToxic 
                ? "bg-amber-500 text-white hover:bg-amber-600" 
                : "bg-black text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-30 dark:disabled:opacity-30"
            }`}
          >
            {isPending ? "..." : toxicInfo.isToxic ? "Rewrite" : "Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}