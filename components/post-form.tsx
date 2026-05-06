"use client";

import { useState, useRef } from "react";
import { createPost } from "@/app/actions";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react"; // ★ 追加

interface PostResult {
  isToxic?: boolean;
  reason?: string;
  suggestions?: string[];
  success?: boolean;
}

interface PostFormProps {
  parentId?: number;
  onSuccess?: () => void;
}

export default function PostForm({ parentId, onSuccess }: PostFormProps) {
  const [content, setContent] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends">("public");
  
  // ★ 追加：Next.jsの更新状態を管理する
  const [isPending, startTransition] = useTransition();

  const [toxicInfo, setToxicInfo] = useState<{ isToxic: boolean; suggestions: string[] }>({
    isToxic: false,
    suggestions: [],
  });

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isReply = !!parentId;

  const handleReset = () => {
    setContent("");
    setPreviewUrl(null);
    setToxicInfo({ isToxic: false, suggestions: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSuggestionClick = (suggestedText: string) => {
    setContent(suggestedText);
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCompressing(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (parentId) formData.append("parent_id", parentId.toString());

      if (!isVideo) {
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 1024 * 1024) {
          const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1200, useWebWorker: true };
          const compressedFile = await imageCompression(imageFile, options);
          formData.set("image", compressedFile, compressedFile.name);
        }
      }

      // 1. 投稿処理の実行
      const result = (await createPost(formData)) as PostResult;

      if (result && result.isToxic) {
        setToxicInfo({ isToxic: true, suggestions: result.suggestions || [] });
        toast.warning("その言葉を伝えたら、貴方は笑顔になれますか");
        setIsCompressing(false);
        return;
      }

      // --- 更新処理を確実に実行させる修正 ---
      if (result.success) {
  // ① まず入力をリセット
  handleReset();
  // ② 画面更新を startTransition で囲んで確実に実行
  startTransition(() => {
    router.refresh(); 
    // ここで親の関数を呼ぶ。もし FilteredTimeline 側の関数が動いていないなら
    // ここで直接 router.refresh() が動くことで解決するはず
    if (onSuccess) {
      onSuccess();
    }
  });

  toast.success(isReply ? "返信しました！" : "投稿しました！");
}

    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-3">
      {toxicInfo.isToxic && (
        <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100 p-4 rounded-[1.2rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            攻撃的な言葉は時に自分の心まで傷つけてしまいます。こんな言葉はどうでしょうか。
          </p>
          <div className="flex flex-col gap-2">
            {toxicInfo.suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(text)}
                className="text-left text-[11px] font-bold bg-white hover:bg-amber-50 border border-amber-100 p-3 rounded-xl transition-all active:scale-95 text-gray-700 shadow-sm"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${isReply ? "bg-gray-50/50" : "bg-white"} p-4 rounded-[1.5rem] shadow-sm border transition-all ${
          toxicInfo.isToxic ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100"
        } ${isPending ? "opacity-70 pointer-events-none" : ""}`}
      >
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "優しい返信を送りましょう" : "最近あった、いいことは？"}
          className={`w-full p-4 rounded-2xl outline-none border-none resize-none transition-all text-base ${
            toxicInfo.isToxic ? "bg-amber-50/50" : "bg-gray-50"
          }`}
          rows={isReply ? 2 : 1}
          required
        />

        <div className="flex flex-row justify-between items-center gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <input
                ref={fileInputRef}
                type="file"
                name={isVideo ? "video" : "image"}
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     setPreviewUrl(URL.createObjectURL(file));
                     setIsVideo(file.type.startsWith('video/'));
                   }
                }}
              />
            </label>

            {!isReply && (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setPrivacyLevel((prev) => (prev === "public" ? "friends" : "public"))}
                  className="relative w-14 h-7 bg-gray-100 rounded-full p-1 cursor-pointer select-none border border-gray-200/50"
                >
                  <div
                    className={`absolute top-1 bottom-1 w-5 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${
                      privacyLevel === "public" ? "left-1 bg-green-500" : "left-[32px] bg-blue-500"
                    }`}
                  >
                    {privacyLevel === "public" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-white">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-white">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <input type="hidden" name="privacy_level" value={privacyLevel} />
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-[9px] font-black text-gray-300 hover:text-gray-600 transition-colors uppercase tracking-widest"
            >
              RESET
            </button>
          </div>

          <button
            type="submit"
            disabled={isCompressing || isPending || !content.trim()}
            className={`font-black text-[10px] py-2.5 px-6 rounded-full shadow-md transition-all tracking-widest uppercase active:scale-95 ${
              toxicInfo.isToxic
                ? "bg-amber-500 text-white"
                : "bg-black text-white hover:bg-gray-800 disabled:opacity-30"
            }`}
          >
            {isCompressing || isPending ? "..." : toxicInfo.isToxic ? "Rewrite" : isReply ? "Reply" : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
}