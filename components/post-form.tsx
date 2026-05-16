"use client";

import { useState, useRef } from "react";
import { createPost } from "@/app/actions";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";
// Lucideアイコンをインポート
import { Globe, Lock, Image as ImageIcon } from "lucide-react";

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

const GOLD_COLOR = "#B8860B";

export default function PostForm({ parentId, onSuccess }: PostFormProps) {
  const [content, setContent] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends">("public");
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
      if (parentId) {
        formData.append("parent_id", parentId.toString());
        formData.append("post_type", "reply");
      } else {
        formData.append("post_type", "post");
      }

      if (!isVideo) {
        const imageFile = formData.get("media") as File;
        if (imageFile && imageFile.size > 1024 * 1024) {
          const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1200, useWebWorker: true };
          const compressedFile = await imageCompression(imageFile, options);
          formData.set("media", compressedFile, compressedFile.name);
        }
      }

      const result = (await createPost(formData)) as PostResult;

      if (result && result.isToxic) {
        setToxicInfo({ isToxic: true, suggestions: result.suggestions || [] });
        toast.warning("その言葉を伝えたら、貴方は笑顔になれますか");
        setIsCompressing(false);
        return;
      }

      if (result.success) {
        handleReset();
        
        // 🛠️ 成功時のトーストを表示
        toast.success(isReply ? "返信しました！" : "投稿しました！");

        // 🛠️ 最も確実にデータベースの最新データを反映しタイムラインを更新するため、画面をリロード
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          window.location.reload(); 
        }, 300); // トーストアニメーションが少し見えるように一瞬だけ待ってリロード
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
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: GOLD_COLOR }}>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            {isReply 
              ? "相手の心に寄り添う言葉を選んでみませんか。" 
              : "攻撃的な言葉は時に自分の心まで傷つけてしまいます。"}
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
        className={`${isReply ? "bg-gray-50/50" : "bg-white"} p-4 rounded-[2rem] shadow-sm border transition-all ${
          toxicInfo.isToxic ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100"
        } ${isPending ? "opacity-70 pointer-events-none" : ""}`}
      >
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "優しい返信を送りましょう" : "最近あった、いいことは？"}
          className={`w-full p-4 rounded-2xl outline-none border-none resize-none transition-all text-base text-gray-800 placeholder-gray-400 font-medium ${
            toxicInfo.isToxic ? "bg-amber-50/50" : "bg-gray-50/60"
          }`}
          rows={isReply ? 2 : 1}
          required
        />

        {previewUrl && (
          <div className="mt-2 relative inline-block">
            {isVideo ? (
              <video src={previewUrl} className="h-32 rounded-xl" controls />
            ) : (
              <img src={previewUrl} alt="Preview" className="h-32 rounded-xl object-cover" />
            )}
            <button
              type="button"
              onClick={() => { setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-row justify-between items-center gap-3 mt-4">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center shadow-sm border border-gray-100">
              <ImageIcon size={18} strokeWidth={2} style={{ color: GOLD_COLOR }} />
              <input
                ref={fileInputRef}
                type="file"
                name="media"
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
                  className="relative w-14 h-8 bg-gray-100 rounded-full p-1 cursor-pointer select-none border border-gray-200/50 shadow-inner transition-colors overflow-hidden"
                >
                  <div
                    className={`absolute top-1 bottom-1 w-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                      privacyLevel === "public" ? "left-1 bg-white" : "left-[28px] bg-white"
                    }`}
                  >
                    {privacyLevel === "public" ? (
                      <Globe size={13} strokeWidth={2.5} style={{ color: GOLD_COLOR }} />
                    ) : (
                      <Lock size={13} strokeWidth={2.5} className="text-gray-400" />
                    )}
                  </div>
                </div>
                <input type="hidden" name="privacy_level" value={privacyLevel} />
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-[9px] font-black transition-colors uppercase tracking-[0.15em] ml-1"
              style={{ color: GOLD_COLOR }}
            >
              RESET
            </button>
          </div>

          <button
            type="submit"
            disabled={isCompressing || isPending || !content.trim()}
            className={`font-black text-[10px] py-3 px-7 rounded-full shadow-lg transition-all tracking-widest uppercase active:scale-95 text-white ${
              toxicInfo.isToxic
                ? "bg-amber-500"
                : "hover:opacity-90 disabled:opacity-30 shadow-[#B8860B]/20"
            }`}
            style={!toxicInfo.isToxic ? { backgroundColor: GOLD_COLOR } : {}}
          >
            {isCompressing || isPending ? "..." : toxicInfo.isToxic ? "Rewrite" : isReply ? "Reply" : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
}