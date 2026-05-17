export default function Loading() {
  return (
    /* 💡 修正箇所1: 背景色をライト時は明るいグレー、ダーク時は深めの黒(zinc-950)に */
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 flex flex-col p-4 transition-colors duration-200">
      
      {/* インスタのスケルトンのようなローディング表示 */}
      <div className="animate-pulse space-y-4 w-full max-w-md mx-auto mt-20">
        
        {/* 💡 修正箇所2: スケルトンのパーツをダーク時は zinc-800 に変更して、黒い背景から優しく浮かび上がらせます */}
        <div className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-[2.5rem]"></div>
        <div className="h-12 bg-gray-200 dark:bg-zinc-800 rounded-2xl w-3/4"></div>
        <div className="h-12 bg-gray-200 dark:bg-zinc-800 rounded-2xl"></div>
        
      </div>
    </div>
  );
}