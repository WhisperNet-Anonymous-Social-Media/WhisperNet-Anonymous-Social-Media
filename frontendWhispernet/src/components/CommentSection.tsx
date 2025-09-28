import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface Comment {
  pseudonym: string;
  comment: string;
  createdAt: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="flex items-start space-x-3 py-4">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-sm">{comment.pseudonym}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90">{comment.comment}</p>
      </div>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-border/30">
      {/* Form to add a new comment */}
      <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 mb-4">
        <div className="flex-1 relative">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="pr-12 min-h-[40px]"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* List of existing comments */}
      <div className="space-y-2">
        {comments.map((comment, index) => (
          <CommentCard key={index} comment={comment} />
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-4">
            No comments yet. Be the first to reply!
          </p>
        )}
      </div>
    </div>
  );
};
