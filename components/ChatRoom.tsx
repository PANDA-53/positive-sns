"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { fetchDirectMessages, sendDirectMessage } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // 💡 画面遷移のために追加

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface ChatRoomProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
}

const GOLD_COLOR = "#B8860B";

export default function ChatRoom({ currentUserId, targetUserId, targetUserName }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // 💡 ルーターの初期化

  // AI警告が出た場合のステート
  const [toxicInfo, setToxicInfo] = useState<{ isToxic: boolean; suggestions: string[] }>({
    isToxic: false,
    suggestions: [],
  });

  // メッセージ履歴の取得
  const loadMessages = async () => {
    const data = await fetchDirectMessages(targetUserId);
    setMessages(data as Message[]);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  // メッセージ追加時に最下部へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReset = () => {
    setInput("");
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleSuggestionClick = (suggestedText: string) => {
    setInput(suggestedText);
    setToxicInfo({ isToxic: false, suggestions: [] });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const currentInput = input;
    startTransition(async () => {
      const result = await sendDirectMessage(targetUserId, currentInput);

      if (result && (result as any).isToxic) {
        setToxicInfo({ isToxic: true, suggestions: (result as any).suggestions || [] });
        toast.warning("その言葉を伝えたら、貴方は笑顔になれますか");
        return;
      }

      if (result.success) {
        handleReset();
        await loadMessages();
      } else {
        toast.error("送信に失敗しました");
      }
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm max-w-md mx-auto w-full">
      {/* 💡 ヘッダー：左側に戻るボタン、中央にタイトルを配置 */}
      <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          type="button"
          onClick={() => router.back()} // 💡 前の画面に戻る
          className="flex items-center gap-1 text-[10px] font-black transition-colors uppercase tracking-widest hover:opacity-70"
          style={{ color: GOLD_COLOR }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>BACK</span>
        </button>

        <h2 className="font-bold text-gray-800 text-sm">{targetUserName} さんとのトーク</h2>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD_COLOR }} />
      </div>

      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm text-gray-800 ${
                  isMe
                    ? "rounded-tr-none text-right" 
                    : "bg-gray-50 rounded-tl-none border border-gray-100" 
                }`}
                style={
                  isMe 
                    ? { backgroundColor: '#F9F6E5', borderColor: '#B8860B33', borderWidth: '1px' } 
                    : {}
                }
              >
                <p className="break-all text-left">{msg.message}</p>
                <span className="text-[9px] block text-right mt-1 opacity-50 text-gray-500">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* AI言い換え案エリア */}
      {toxicInfo.isToxic && (
        <div className="p-3 bg-gradient-to-br from-amber-50 to-white border-t border-amber-100 space-y-2 animate-in fade-in">
          <p className="text-[10px] font-bold text-amber-800 flex items-center gap-2">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
            メッセージを少し整えてみませんか？
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

      {/* 入力フォーム */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none outline-none resize-none text-gray-800 placeholder-gray-400 font-medium"
          rows={2}
          required
        />
        <div className="flex justify-end items-center gap-4 mt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-[9px] font-black transition-colors uppercase tracking-[0.15em]"
            style={{ color: GOLD_COLOR }}
          >
            RESET
          </button>
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="px-5 py-2 rounded-full text-[11px] font-bold text-white transition-all active:scale-95 disabled:opacity-30 hover:opacity-90"
            style={{ backgroundColor: GOLD_COLOR }}
          >
            {isPending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}