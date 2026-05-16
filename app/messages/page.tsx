import Link from "next/link";

export default function MessagesPage() {
  return (
    <div className="max-w-md mx-auto p-4 pt-8">
      <h1 className="text-lg font-black tracking-wider mb-6">メッセージ</h1>
      <p className="text-sm text-gray-500">
        プロフィールページの「DMを送る」から新しくチャットを始めることができます。
      </p>
      
      {/* ここには今後、actions.tsの fetchMainTimelineData 内で取得した
        フレンド一覧やDM履歴のあるユーザーをリスト表示するUIを組み込むと綺麗に繋がります。
      */}
    </div>
  );
}