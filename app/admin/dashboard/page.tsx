import { getReportedPosts } from '@/app/actions'

export default async function AdminDashboard() {
  const reports = await getReportedPosts()

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
            Control Center
          </h1>
          <p className="text-sm text-gray-500 font-bold">通報された投稿の確認</p>
        </header>

        <div className="grid gap-6">
          {reports.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
              <p className="text-gray-400 font-bold">現在、チクチクした報告はありません。平和です 🕊️</p>
            </div>
          ) : (
            reports.map((report: any) => (
              <div key={report.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                
                {/* 左側：投稿内容 */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={report.posts?.authorProfile?.avatar_url} className="w-8 h-8 rounded-full border" alt="" />
                    <div>
                      <p className="text-xs font-black text-gray-800">{report.posts?.authorProfile?.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Posted Author</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                    {report.posts?.content}
                  </p>

                  {report.posts?.image_url && (
                    <img src={report.posts.image_url} className="w-full max-h-64 object-cover rounded-2xl border" alt="Reported content" />
                  )}
                  {report.posts?.video_url && (
                    <video src={report.posts.video_url} controls className="w-full rounded-2xl bg-black" />
                  )}
                </div>

                {/* 右側：通報情報とアクション */}
                <div className="w-full md:w-72 bg-gray-50/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="mb-6">
                      <span className="inline-block bg-rose-100 text-rose-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                        Reason: {report.reason}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Reporter: <span className="text-gray-600">{report.reporterProfile?.full_name}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Date: <span className="text-gray-600">{new Date(report.created_at).toLocaleString('ja-JP')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full bg-white border border-gray-200 text-gray-600 text-[10px] font-black py-3 rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest">
                      問題なし（Dismiss）
                    </button>
                    <button className="w-full bg-rose-500 text-white text-[10px] font-black py-3 rounded-xl hover:bg-rose-600 transition-all shadow-md uppercase tracking-widest">
                      投稿を削除（Execute）
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}