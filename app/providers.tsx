'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // useStateを使ってQueryClientを初期化することで、
  // コンポーネントの再レンダリング時にクライアントが作り直されるのを防ぎます
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ここでグローバルなデフォルト設定ができます
        staleTime: 60 * 1000, // 1分間はデータを「新鮮」とみなしてキャッシュを使う
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開発環境でのみDevtoolsを表示（画面右下にアイコンが出ます） */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}