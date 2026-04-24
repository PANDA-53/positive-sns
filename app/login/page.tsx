import { login } from '../actions'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center italic">Welcome back 🌿</h2>
        <form action={login} className="space-y-5">
          <input 
            name="email" 
            type="email" 
            placeholder="メールアドレス" 
            className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 text-black" 
            required 
          />
          <input 
            name="password" 
            type="password" 
            placeholder="パスワード" 
            className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 text-black" 
            required 
          />
          <button type="submit" className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-600 transition-all active:scale-95">
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}