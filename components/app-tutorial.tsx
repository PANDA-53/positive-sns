'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function AppTutorial() {
  useEffect(() => {
    // 💡 すでにチュートリアルを見たことがあるか確認
    const hasSeenTutorial = localStorage.getItem('has_seen_sns_tutorial')
    if (hasSeenTutorial) return

    // 🎬 2秒後にちょっとリッチに開始（画面のレンダリング安定を待つ）
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        // アプリの色に合わせたカスタムスタイリング
        popoverClass: 'custom-tutorial-popover',
        progressText: '{{current}} / {{total}}',
        nextBtnText: '次へ →',
        prevBtnText: '← 戻る',
        doneBtnText: '優しい世界へ',
        
        steps: [
          {
            element: '#tutorial-step-welcome',
            popover: {
              title: '<span style="color: #B8860B; font-weight: 900;">ようこそ新しいコミュニティへ！</span>',
              description: 'ここは、お互いの素敵な瞬間をリスペクトし合い、温かく繋がる場所です。簡単な歩き方をご案内します！',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '.tutorial-step-level',
            popover: {
              title: '<span style="color: #d97706; font-weight: 900;">経験値＆レベルシステム</span>',
              description: 'あなたの投稿に「Awesome」が集まると、独自のルート（平方根）計算でレベルが上がっていきます。レベルが高い人は一目で分かります！',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '.tutorial-step-hug',
            popover: {
              title: '<span style="color: #f43f5e; font-weight: 900;">寄り添うカルチャー「Hug」</span>',
              description: '通常のいいねだけじゃ足りない、温かい共感や応援の気持ちは「Hug」で伝えましょう。お互いのプロフィールに勲章として蓄積されます。',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '.tutorial-step-media',
            popover: {
              title: '<span style="color: #B8860B; font-weight: 900;">タップで臨場感マックス！</span>',
              description: 'タイムラインの画像や動画をタップすると、映画館のようなフルスクリーン・シネマビューアが起動します。大画面でじっくり作品を楽しみましょう！',
              side: "top",
              align: 'center'
            }
          },
          {
            element: '#tutorial-step-profile-nav',
            popover: {
              title: '<span style="color: #854d0e; font-weight: 900;">プロフィールを整えよう</span>',
              description: '準備ができたら、まずはあなたの自己紹介やアバターを設定しにいきましょう。さあ、コミュニティを楽しんでください！',
              side: "bottom",
              align: 'end'
            }
          }
        ],
        onDestroyed: () => {
          // 閉じるか完了したら、完了フラグをローカルストレージに保存
          localStorage.setItem('has_seen_sns_tutorial', 'true')
        }
      })

      // 要素が存在することを確認してからスタート（エラー防止）
      if (document.querySelector('#tutorial-step-welcome')) {
        driverObj.drive()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null // 視覚的なDOMは持たず、裏でスクリプトだけ動かします
}