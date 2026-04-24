import { createClient } from '../utils/supabase/server'
import { createPost, createReply, logout, uploadAvatar } from './actions'

export default async function Index() {
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const user = userData?.user
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

  const mainPosts = posts?.filter(p => !p.parent_id)
  const replies = posts?.filter(p => p.parent_id)

  return (
    <main className="max-w-xl mx-auto p-4 min-h-screen bg-gray-50 text-black">
      <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border">
        <h1 className="text-xl font-bold text-green-700">ポジティブSNS 🌿</h1>
        {user ? (
          <form action={logout}><button className="text-[10px] bg-red-50 text-red-500 px-4 py-2 rounded-full font-bold">ログアウト</button></form>
        ) : (
          <a href="/login" className="text-[10px] bg-green-500 text-white px-5 py-2 rounded-full font-bold">ログイン</a>
        )}
      </header>

      {user && (
        <section className="mb-10 space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border">
              <img src={`${supabaseUrl}/storage/v1/object/public/avatars/${user.id}.png?t=${Date.now()}`} onError={(e) => (e.currentTarget.src = defaultAvatar)} className="w-full h-full object-cover" />
            </div>
            <form action={uploadAvatar} className="flex gap-2">
              <input type="file" name="file" accept="image/*" className="text-[10px] w-32" required />
              <button type="submit" className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-full">更新</button>
            </form>
          </div>
          <form action={createPost} className="bg-white p-6 rounded-3xl shadow-lg border border-green-50">
            <textarea name="content" placeholder="最近あった、いいことは？" className="w-full p-4 bg-gray-50 rounded-2xl outline-none resize-none" rows={3} required />
            <button type="submit" className="mt-3 w-full bg-green-500 text-white font-bold py-4 rounded-2xl">投稿する</button>
          </form>
        </section>
      )}

      <div className="space-y-8">
        {mainPosts?.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-100">
                <img src={`${supabaseUrl}/storage/v1/object/public/avatars/${post.user_id}.png`} onError={(e) => (e.currentTarget.src = defaultAvatar)} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold text-green-700">{post.user_name}</span>
            </div>
            <p className="text-base text-gray-800 mb-4">{post.content}</p>
            <div className="ml-8 space-y-3 border-l-2 border-gray-100 pl-4 mb-4 text-sm">
              {replies?.filter(r => r.parent_id === post.id).map(reply => (
                <div key={reply.id}><span className="font-bold text-green-600">{reply.user_name}:</span> {reply.content}</div>
              ))}
            </div>
            {user && (
              <form action={createReply} className="flex gap-2">
                <input type="hidden" name="parentId" value={post.id} />
                <input name="content" placeholder="返信する..." className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" required />
                <button type="submit" className="text-green-600 font-bold text-sm">送信</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}