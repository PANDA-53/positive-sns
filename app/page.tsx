import { createClient } from '../utils/supabase/server'
import { createPost, createComment } from './actions'

export default async function Index() {
  const supabase = await createClient()

  // 1. 投稿データと、その投稿に紐づくコメントを一緒に取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, 
      content, 
      created_at, 
      user_name,
      comments (
        id,
        content,
        user_name,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("データ取得エラー:", error.message)
  }

  // 2. 現在ログインしているユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 text-black">
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

      {/* 投稿フォーム */}
      {user ? (
        <form action={createPost} className="mb-8 md:mb-10 bg-white p-4 md:p-5 rounded-2xl shadow-md border border-green-50">
          <textarea
            name="content"
            placeholder="最近あった、ちょっといいことは？"
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
          <p className="text-orange-700 font-medium text-sm">投稿するにはログインが必要です</p>
          <a href="/login" className="text-xs underline text-orange-600 mt-2 inline-block">ログインページへ</a>
        </div>
      )}

      {/* 投稿一覧 */}
      <div className="space-y-6 md:space-y-8">
        {(!posts || posts.length === 0) && (
          <p className="text-center text-gray-400 py-10 text-sm">まだ投稿がありません。</p>
        )}
        {posts?.map((post: any) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* メイン投稿内容 */}
            <div className="p-4 md:p-5 pb-2">
              <p className="text-base md:text-lg text-gray-800 mb-4 leading-relaxed">{post.content}</p>
              <div className="flex justify-between items-center text-[11px] md:text-xs text-gray-400 pb-3 border-b border-gray-50">
                <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  👤 {post.user_name || 'Gimax'} 
                </span>
                <span>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>

            {/* コメントセクション */}
            <div className="bg-gray-50/80 p-4">
              <div className="space-y-3 mb-4">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment: any) => (
                    <div key={comment.id} className="text-sm bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-gray-700">
                        <span className="font-bold text-green-700 mr-1">{comment.user_name}:</span>
                        {comment.content}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-gray-400 italic">まだコメントはありません</p>
                )}
              </div>

              {/* コメント入力欄 */}
              {user && (
                <form action={createComment} className="flex gap-2">
                  <input type="hidden" name="postId" value={post.id} />
                  <input
                    name="content"
                    placeholder="コメント..."
                    className="flex-1 text-sm p-2 px-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                    required
                  />
                  <button className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold hover:bg-green-600 transition-colors shadow-sm">
                    送信
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}