import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Smile } from 'lucide-react';
import API from '@/api';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  pseudonym: string;
  comment: string;
  createdAt?: string;
}

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ comments: initialComments, postId }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await API.post(`/posts/comment/${postId}`, { comment: newComment });
      setComments(data.comments);
      setNewComment('');
      setShowEmoji(false);
    } catch (error) {
      console.error("Failed to post comment");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 && <p className="text-xs text-muted-foreground text-center italic">No whispers yet.</p>}
        {comments.map((c, idx) => (
          <div key={idx} className="flex gap-2.5 items-start">
            <Avatar className="w-6 h-6 border border-border/50">
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">{c.pseudonym[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-background/50 p-2 rounded-lg border border-border/30">
              <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-bold text-foreground/80">{c.pseudonym}</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">{c.comment}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input with Emoji */}
      <div className="flex gap-2 items-center pt-2 border-t border-border/30 relative">
        <Button 
            variant="ghost" size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-primary"
            onClick={() => setShowEmoji(!showEmoji)}
        >
            <Smile className="w-4 h-4" />
        </Button>

        <AnimatePresence>
            {showEmoji && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-12 left-0 z-50 shadow-xl rounded-xl border bg-background"
                >
                    <EmojiPicker 
                        onEmojiClick={(e) => setNewComment(prev => prev + e.emoji)} 
                        width={280} 
                        height={350} 
                        searchDisabled 
                        previewConfig={{ showPreview: false }}
                    />
                </motion.div>
            )}
        </AnimatePresence>

        <Input 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Reply to this whisper..."
          className="h-9 text-xs bg-muted/30 border-none focus-visible:ring-1"
          onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={handlePostComment} disabled={!newComment.trim()}>
            <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};