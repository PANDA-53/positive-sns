import { createClient } from '../utils/supabase/server'
import { createPost, createComment, logout, uploadAvatar } from './actions'

export default async function Index() {
  const supabase = await createClient()

  // avatar_url も含めて取得
  const { data: posts } = await supabase
    .from('posts')
    .select(`id, content, created_at, user_name, avatar_url, comments(id, content, user_name)`)
    .order('created_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 text-black">
      <header className="flex flex-col gap-4 mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-700">POSITIVE SNS</h1>
          {user && (
            <form action={logout}>
              <button className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold">ログアウト</button>
            </form>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-4 p-3 bg-green-50/30 rounded-2xl border border-green-50">
            {/* 現在のアイコン表示 */}
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200 shrink-0">
              <img 
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png?t=${Date.now()}`} 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = "https://www.gravatar.com/avatar/?d=mp")}
              />
            </div>
            {/* ★ 画像アップロードフォーム */}
            <form action={uploadAvatar} className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2">
                <input type="file" name="file" accept="image/*" className="text-[10px] text-gray-400 w-32 cursor-pointer" required />
                <button type="submit" className="bg-green-600 text-white text-[9px] px-3 py-1 rounded-full font-bold shadow-sm hover:bg-green-700">
                  画像を更新
                </button>
              </div>
            </form>
          </div>
        ) : (
          <a href="/login" className="text-center bg-green-500 text-white py-3 rounded-2xl font-bold">ログインして参加</a>
        )}
      </header>

      {user && (
        <form action={createPost} className="mb-10 bg-white p-5 rounded-3xl shadow-md border border-green-50">
          <textarea name="content" placeholder="最近あった、いいことは？" className="w-full p-4 border-none bg-gray-50 rounded-2xl text-black resize-none outline-none focus:ring-2 focus:ring-green-400" rows={3} required />
          <button type="submit" className="mt-3 w-full bg-green-500 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-green-600 transition-all active:scale-95">投稿する</button>
        </form>
      )}

      {/* タイムライン */}
      <div className="space-y-6">
        {posts?.map((post: any) => (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {/* 投稿者のアバター表示 */}
                <img src={post.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} className="w-7 h-7 rounded-full object-cover border" />
                <span className="text-xs font-bold text-green-600">{post.user_name}</span>
              </div>
              <p className="text-base text-gray-800 leading-relaxed font-medium">{post.content}</p>
            </div>
            {/* コメントセクション */}
            <div className="bg-gray-50/50 p-4 border-t border-gray-50">
              <div className="space-y-2 mb-4">
                {post.comments?.map((c: any) => (
                  <div key={c.id} className="text-xs bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <span className="font-bold text-green-700 mr-2">{c.user_name}</span>{c.content}
                  </div>
                ))}
              </div>
              {user && (
                <form action={createComment} className="flex gap-2">
                  <input type="hidden" name="postId" value={post.id} />
                  <input name="content" placeholder="返信..." className="flex-1 text-xs p-2 px-4 border border-gray-200 rounded-full outline-none bg-white text-black" required />
                  <button className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">送信</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}