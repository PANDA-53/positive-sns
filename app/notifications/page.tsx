import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Mail, BellOff } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GOLD_COLOR = "#B8860B";
const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // 1. 自分宛ての通知を最大20件取得
  const { data: rawNotifications, error: fetchError } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (fetchError) {
    console.error("通知の取得に失敗しました:", fetchError.message);
  }

  let notificationsWithProfiles = [];

  if (rawNotifications && rawNotifications.length > 0) {
    const notifierIds = rawNotifications.map(n => n.notifier_id).filter(Boolean);

    if (notifierIds.length > 0) {
      // 💡 修正箇所：エラーの原因になっていた total_awesome を select から完全に排除しました
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", notifierIds);

      if (profileError) {
        console.error("プロフィール取得エラー:", profileError.message);
      }

      // プロフィールを素直にマッピング結合
      notificationsWithProfiles = rawNotifications.map(n => {
        const foundProfile = profiles?.find(p => p.id === n.notifier_id) || null;
        return {
          ...n,
          notifier: foundProfile
        };
      });
    } else {
      notificationsWithProfiles = rawNotifications.map(n => ({ ...n, notifier: null }));
    }

    // 3. 未読を既読に更新
    const unreadIds = rawNotifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-zinc-100 pb-24 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 pt-6">
        
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">通知</h1>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Your Peace & Connections</p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm text-gray-500" style={{ color: GOLD_COLOR }}>
             {notificationsWithProfiles.length}
          </span>
        </div>

        {/* 通知リストエリア */}
        <div className="space-y-4">
          {notificationsWithProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-gray-300 dark:text-zinc-700 mb-3">
                <BellOff size={20} strokeWidth={2} />
              </div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">No new notifications</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 max-w-[220px] leading-relaxed">
                ここはあなたの心が守られている証拠。新しい穏やかな繋がりを待ちましょう。
              </p>
            </div>
          ) : (
            notificationsWithProfiles.map((notification, idx) => {
              const notifierObj = notification.notifier || {};
              
              // 💡 DBから正しく取得した full_name を反映（空なら匿名のユーザー）
              const notifierName = notifierObj.full_name || "匿名のユーザー";
              const avatarUrl = notifierObj.avatar_url || defaultAvatar;

              // 💡 レベル表示用のAwesome数は、今回は仮で固定値1（または他のロジック）にしてエラーを回避
              const calculatedLevel = 1;

              let icon = <Heart size={14} />;
              let messageText = "新しいアクションがありました";
              let linkUrl = "/";
              let iconColorClass = "text-gray-400 dark:text-zinc-400";
              let iconBgClass = "bg-gray-50/80 dark:bg-zinc-950/80";

              switch (notification.type) {
                case "awesome":
                  icon = <Heart size={14} className="fill-rose-500" />;
                  messageText = "あなたの投稿に Awesome✨ しました";
                  iconColorClass = "text-rose-500 dark:text-rose-400";
                  iconBgClass = "bg-rose-50/60 border border-rose-100/50 dark:bg-rose-950/20 dark:border-rose-900/40";
                  linkUrl = `/`;
                  break;
                case "hug":
                  icon = <Heart size={14} className="fill-pink-500" />;
                  messageText = "あなたの投稿に Hug🫂 しました";
                  iconColorClass = "text-pink-500 dark:text-pink-400";
                  iconBgClass = "bg-pink-50/60 border border-pink-100/50 dark:bg-pink-950/20 dark:border-pink-900/40";
                  linkUrl = `/`;
                  break;
                case "reply":
                  icon = <MessageCircle size={14} className="fill-sky-500" />;
                  messageText = "あなたの投稿にリプライを返しました";
                  iconColorClass = "text-sky-500 dark:text-sky-400";
                  iconBgClass = "bg-sky-50/60 border border-sky-100/50 dark:bg-zinc-950/20 dark:border-sky-900/40";
                  linkUrl = `/`;
                  break;
                case "dm":
                  icon = <Mail size={14} />;
                  messageText = "あなたにダイレクトメッセージを送りました";
                  iconColorClass = "text-amber-600 dark:text-amber-400";
                  iconBgClass = "bg-amber-50/60 border border-amber-100/50 dark:bg-amber-950/20 dark:border-amber-900/40";
                  linkUrl = `/messages`;
                  break;
                default:
                  messageText = `${notification.type} タイプの通知があります`;
                  break;
              }

              return (
                <Link
                  key={`notification-item-${notification.id}-${idx}`}
                  href={linkUrl}
                  className={`block bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border p-5 transition-all duration-200 active:scale-[0.98] relative group ${
                    !notification.is_read 
                      ? "border-amber-400/60 bg-amber-50/5 dark:border-amber-500/40 dark:bg-amber-950/10 shadow-[0_2px_12px_rgba(184,134,11,0.03)]" 
                      : "border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 dark:hover:border-zinc-700/60"
                  }`}
                >
                  {!notification.is_read && (
                    <div className="absolute top-5 right-5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GOLD_COLOR }} />
                  )}

                  <div className="flex items-start gap-3">
                    <img 
                      src={avatarUrl} 
                      className="w-10 h-10 rounded-full object-cover border border-gray-50 dark:border-zinc-800 flex-shrink-0 bg-gray-50 dark:bg-zinc-950" 
                      alt="" 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-gray-800 dark:text-zinc-200 flex items-center flex-wrap gap-x-1.5 gap-y-1 mb-1.5">
                        <span style={{ color: GOLD_COLOR }}>{notifierName}</span>
                        <span className="text-[9px] font-black tracking-tighter text-amber-600 bg-amber-50/70 dark:text-amber-400 dark:bg-zinc-950/40 px-1.5 py-0.5 rounded border border-amber-100/70 dark:border-amber-900/50 shadow-[0_1px_1px_rgba(0,0,0,0.01)]">
                          Lv.{calculatedLevel}
                        </span>
                      </div>

                      <p className="text-[14px] text-gray-700 dark:text-zinc-300 font-medium leading-normal pr-4">
                        {messageText}
                      </p>

                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold block mt-2">
                        {new Date(notification.created_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className={`w-8 h-8 rounded-xl ${iconBgClass} flex items-center justify-center flex-shrink-0 ${iconColorClass} transition-transform group-hover:scale-105 duration-200`}>
                      {icon}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}