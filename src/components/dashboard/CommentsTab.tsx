import React from 'react';

interface Comment {
  id: number;
  blog_id: number;
  blog_title?: string;
  author_name: string;
  author_email?: string;
  content: string;
  admin_reply?: string;
  admin_reply_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

interface CommentsTabProps {
  comments: Comment[];
  openCommentReply: (comment: Comment) => void;
  deleteComment: (id: number) => Promise<void>;
}

export default function CommentsTab({
  comments,
  openCommentReply,
  deleteComment
}: CommentsTabProps) {
  const unrepliedCount = comments.filter(comment => !comment.admin_reply).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">评论管理</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">
            未回复评论: <span className="font-semibold text-orange-600">{unrepliedCount}</span>
          </span>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
              !comment.admin_reply ? 'border-orange-500 bg-orange-50/30' : 'border-green-500'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">{comment.blog_title || '未知博客'}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      !comment.admin_reply ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {!comment.admin_reply ? '待回复' : '已回复'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                    <span><strong>评论者:</strong> {comment.author_name}</span>
                    {comment.author_email && (
                      <span><strong>邮箱:</strong> {comment.author_email}</span>
                    )}
                    <span><strong>时间:</strong> {new Date(comment.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">评论内容</label>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-800 text-sm">{comment.content}</p>
                    </div>
                  </div>
                  
                  {comment.admin_reply && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <label className="block text-sm font-medium text-green-700 mb-1">管理员回复</label>
                      <p className="text-sm text-green-800">{comment.admin_reply}</p>
                      <p className="text-xs text-green-600 mt-1">
                        回复时间: {comment.admin_reply_at ? new Date(comment.admin_reply_at).toLocaleString('zh-CN') : ''}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!comment.admin_reply && (
                    <button
                      onClick={() => openCommentReply(comment)}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                      title="回复评论"
                    >
                      💬
                    </button>
                  )}
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="删除评论"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">还没有评论</h3>
            <p className="text-gray-600">当有用户在博客下发表评论时，它们会显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
}