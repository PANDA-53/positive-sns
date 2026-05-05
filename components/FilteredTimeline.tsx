"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TimelineSwitch from './TimelineSwitch'
import { ReactionButtons } from './reaction-buttons'
import { FriendButton } from './friend-button'
import { ReportButton } from './report-button'
import ReplyForm from './ReplyForm'
import { deletePost } from '@/app/actions'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

export default function FilteredTimeline({ mainPosts = [], replies = [], user, friendIds = [] }: any) {
  const [viewMode, setViewMode] = useState<'friends' | 'public'>('public')
  const [mounted, setMounted] = useState(false)

  // 日付の表示ズレを防ぐため、マウントされるまで待つ
  useEffect(() => { setMounted(true) }, [])

  const displayPosts = (mainPosts || []).filter((post: any) => {
    if (!post) return false;
    if (viewMode === 'public') return true;
    return post.user_id === user?.id || (friendIds && friendIds.includes(post.user_id));
  });

  if (!mounted) return <div className="space-y-4 pt-10"><div className="h-40 bg-white rounded-3xl animate-pulse" /></div>;

  return (
    <>
      <div className="flex justify-center mb-6">
        <TimelineSwitch onChange={(mode: any) => setViewMode(mode)} />
      </div>

      <div className="space-y-3 pb-20">
        {displayPosts.map((post: any) => (
          <div key={post.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <Link href={`/users/${post.user_id}`} className="flex items-center gap-2.5">
                <img src={post.authorProfile?.avatar_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover border" alt="" />
                <div className="flex flex-col text-black">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{post.authorProfile?.full_name}</span>
                    <span className="text-[10px]">{post.privacy_level === 'friends' ? '🔒' : '🌐'}</span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </Link>
              
              <div className="flex items-center gap-2">
                {post.user_id === user?.id ? (
                  <form action={deletePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button type="submit" className="text-[10px] text-gray-300 hover:text-red-500 font-bold px-2 py-1">削除</button>
                  </form>
                ) : (
                  <FriendButton targetUserId={post.user_id} initialStatus={post.friendStatus} />
                )}
              </div>
            </div>
            
            <p className="text-[15px] font-medium text-gray-800 mb-3 whitespace-pre-wrap leading-snug">{post.content}</p>
            
            {post.video_url ? (
  <div className="-mx-5 mb-4 bg-black overflow-hidden border-y border-gray-100 aspect-video flex items-center justify-center">
    <video 
      src={post.video_url} 
      className="w-full h-full object-cover" // 余白を埋めて枠いっぱいに広げる
      autoPlay 
      muted 
      loop 
      playsInline
      controls={false}
    />
  </div>
) : post.image_url && (
  <div className="-mx-5 mb-4 bg-gray-50 overflow-hidden border-y border-gray-100 flex items-center justify-center">
    <img src={post.image_url} alt="" className="w-full h-auto object-cover max-h-[500px]" />
  </div>
)}
            <div className="flex items-center justify-between mb-2">
              <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
              {post.user_id !== user?.id && <ReportButton postId={post.id} />}
            </div>
            
            {replies.some((r: any) => r.parent_id === post.id) && (
              <div className="ml-4 mt-4 space-y-2 border-l-2 border-gray-100 pl-4 mb-4">
                {replies.filter((r: any) => r.parent_id === post.id).map((reply: any) => (
                  <div key={reply.id} className="bg-gray-50 p-3 rounded-xl">
                    <span className="font-bold text-[9px] text-gray-400 uppercase">{reply.authorProfile?.full_name}</span>
                    <p className="text-gray-700 text-xs font-medium">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2"><ReplyForm parentId={post.id} /></div>
          </div>
        ))}
      </div>
    </>
  )
}