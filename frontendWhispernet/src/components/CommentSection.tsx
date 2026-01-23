import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API from '@/api';
import { toast } from 'sonner';

interface Comment {
  pseudonym: string;
  comment: string;
  createdAt: string;
}

interface CommentSectionProps {
  comments: Comment[];
  postId: string; 
}

export const CommentSection: React.FC<CommentSectionProps> = ({ comments: initialComments, postId }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await API.post(`/posts/comment/${postId}`, { comment: newComment });
      setComments(res.data.comments);
      setNewComment('');
      toast.success("Comment added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="flex space-x-3 text-sm">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-muted">
                  {comment.pseudonym[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/30 p-2 rounded-lg">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-xs">{comment.pseudonym}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-foreground/90">{comment.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a reply..."
          className="h-9 text-sm"
        />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};