"use client";

import { useState, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase"; 

export default function CreatePostPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [text, setText] = useState("ここをドラッグ！");
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [loading, setLoading] = useState(false);
  
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!constraintsRef.current) return;
    const container = constraintsRef.current.getBoundingClientRect();
    const x = ((info.point.x - container.left) / container.width) * 100;
    const y = ((info.point.y - container.top) / container.height) * 100;
    setPosition({ x, y });
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    setLoading(true);

    try {
      // 1. ストレージ（videosバケット）への保存
      const fileName = `${Date.now()}_${videoFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile);

      if (storageError) {
        throw new Error(`【動画保存エラー】: ${storageError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      // 2. データベース（postsテーブル）への保存
      const { error: dbError } = await supabase
        .from("posts")
        .insert({
          video_url: publicUrl,
          overlay_text: text,
          text_x: position.x,
          text_y: position.y,
        });

      if (dbError) {
        throw new Error(`【文字保存エラー】: ${dbError.message}\n${dbError.hint || ""}`);
      }

      alert("投稿が完了しました！");
      router.push("/"); 
    } catch (err: any) {
      console.error(err);
      // 詳細なエラーをアラートで表示
      alert(err.message || "予期せぬエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-black text-white pb-20">
      <div className="w-full flex justify-between items-center mb-6">
        <Link href="/" className="text-gray-400 text-sm">キャンセル</Link>
        <h1 className="font-bold text-lg">編集して投稿</h1>
        <button 
          onClick={handleUpload}
          disabled={!videoSrc || loading}
          className="text-blue-500 font-bold disabled:text-gray-600"
        >
          {loading ? "送信中..." : "シェア"}
        </button>
      </div>

      {!videoSrc ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-3xl w-full max-w-[350px] aspect-[9/16]">
          <input 
            type="file" 
            id="v-up" 
            accept="video/*" 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <label htmlFor="v-up" className="bg-white text-black px-8 py-3 rounded-full font-bold cursor-pointer hover:bg-gray-200 transition-colors">
            動画を選択
          </label>
        </div>
      ) : (
        <div className="w-full max-w-[350px] flex flex-col gap-6">
          <div 
            ref={constraintsRef} 
            className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800"
          >
            <video 
              src={videoSrc} 
              className="w-full h-full object-cover pointer-events-none" 
              autoPlay loop muted playsInline 
            />
            
            <motion.div
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              className="absolute z-10 cursor-move touch-none"
              style={{ top: `${position.y}%`, left: `${position.x}%` }}
            >
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 shadow-lg">
                <p className="text-white text-2xl font-bold drop-shadow-lg whitespace-nowrap select-none">
                  {text || "文字を入力"}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 ml-2">文字を編集</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-900 border border-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="何て書く？"
            />
          </div>
        </div>
      )}
    </div>
  );
}