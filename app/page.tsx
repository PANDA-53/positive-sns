import { createClient } from '../utils/supabase/server'
import { createPost, createReply, logout } from './actions'

export default async function Index() {
  const supabase = await createClient()

  // 1. 全ての投稿データを取得
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. ユーザー情報を安全に取得（エラー時は user: null にする）
  const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const user = userData?.user
  
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

  // 親投稿（返信ではないもの）と、返信データを分離
  const mainPosts = posts?.filter(p => !p.parent_id)
  const replies = posts?.filter(p => p.parent_id)

  return (
    <main className="max-w-xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 text-black">
      <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-green-700">ポジティブSNS 🌿</h1>
        {user ? (
          <form action={logout}>
            <button className="text-[10px] bg-red-50 text-red-500 px-4 py-2 rounded-full font-bold">ログアウト</button>
          </form>
        ) : (
          <a href="/login" className="text-[10px] bg-green-500 text-white px-5 py-2 rounded-full font-bold shadow-md">ログイン</a>
        )}
      </header>

      {/* ログイン時：新規投稿フォームを表示 */}
      {user && (
        <section className="mb-10">
          <form action={createPost} className="bg-white p-6 rounded-3xl shadow-lg border border-green-50">
            <textarea 
              name="content" 
              placeholder="最近あった、いいことは？" 
              className="w-full p-4 bg-gray-50 rounded-2xl text-black resize-none outline-none border-none" 
              rows={3} 
              required 
            />
            <button type="submit" className="mt-3 w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg">ポジティブをシェア</button>
          </form>
        </section>
      )}

      {/* タイムライン */}
      <div className="space-y-8">
        {mainPosts?.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-100">
                <img src={defaultAvatar} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold text-green-700">{post.user_name || '匿名'}</span>
              <span className="text-[10px] text-gray-300 ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            
            <p className="text-base text-gray-800 leading-relaxed font-medium mb-4">{post.content}</p>

            {/* 返信一覧を表示 */}
            <div className="ml-8 space-y-3 border-l-2 border-gray-100 pl-4 mb-4 text-sm">
              {replies?.filter(r => r.parent_id === post.id).map(reply => (
                <div key={reply.id} className="animate-in fade-in duration-300">
                  <span className="font-bold text-green-600">{reply.user_name || '匿名'}:</span>
                  <span className="ml-2 text-gray-700">{reply.content}</span>
                </div>
              ))}
            </div>

            {/* ログイン時：返信フォームを表示 */}
            {user && (
              <form action={createReply} className="flex gap-2">
                <input type="hidden" name="parentId" value={post.id} />
                <input 
                  name="content" 
                  placeholder="返信する..." 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-green-200" 
                  required 
                />
                <button type="submit" className="text-green-600 font-bold text-sm hover:text-green-800">送信</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}