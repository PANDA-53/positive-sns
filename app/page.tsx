import { createClient } from '../utils/supabase/server'
import { createPost } from './actions'

export default async function Index() {
  const supabase = await createClient()

  // 1. 投稿データを取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, created_at, user_name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("データ取得エラー:", error.message)
  }

  // 2. 現在ログインしているユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser()

  return (
    /* スマホでは左右に少し隙間(px-4)、PCではゆったり(md:p-6) */
    <main className="max-w-xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-green-700 flex items-center gap-2">
          ポジティブSNS 🌿
        </h1>
        {user && (
          <div className="bg-white/60 backdrop-blur-sm p-2 px-3 rounded-xl border border-green-100 w-full md:w-auto shadow-sm">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Logged in</p>
            <p className="text-xs md:text-sm font-medium text-gray-700 truncate">{user.email}</p>
          </div>
        )}
      </header>

      {/* 投稿フォーム：スマホで入力しやすいよう調整 */}
      {user ? (
        <form action={createPost} className="mb-8 md:mb-10 bg-white p-4 md:p-5 rounded-2xl shadow-md border border-green-50">
          <textarea
            name="content"
            placeholder="最近あった、ちょっといいことは？"
            /* text-base以上にすることでiPhoneの自動ズームを防止 */
            className="w-full p-3 md:p-4 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-black text-base placeholder-gray-400 resize-none bg-gray-50"
            rows={3}
            required
          />
          <button
            type="submit"
            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 md:py-4 rounded-xl transition-all shadow-lg active:scale-95 text-sm md:text-base"
          >
            ポジティブをシェアする
          </button>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-orange-50 rounded-2xl text-center border border-orange-100">
          <p className="text-orange-700 font-medium text-sm">投稿にはログインが必要です</p>
          <a href="/login" className="text-xs underline text-orange-600 mt-2 inline-block">ログインページへ</a>
        </div>
      )}

      {/* 投稿一覧（フィード）：スマホではカードの間隔を少し詰める */}
      <div className="space-y-4 md:space-y-6">
        {(!posts || posts.length === 0) && (
          <p className="text-center text-gray-400 py-10 text-sm">まだ投稿がありません。最初のポジティブを書きましょう！</p>
        )}
        {posts?.map((post: any) => (
          <div key={post.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
            <p className="text-base md:text-lg text-gray-800 mb-4 leading-relaxed">{post.content}</p>
            <div className="flex justify-between items-center text-[11px] md:text-xs border-t border-gray-50 pt-3">
              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                👤 {post.user_name || 'Gimax'} 
              </span>
              <span className="text-gray-400">
                {new Date(post.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}