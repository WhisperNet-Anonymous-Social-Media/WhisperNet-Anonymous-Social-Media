import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, MoreHorizontal, Flag, Clock, Sparkles, Send, Share2, Copy, EyeOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import API from '@/api';
import { CommentSection } from './CommentSection'; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  media?: { url: string; type: string };
  likes: string[]; 
  comments: any[];
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentPseudonym?: string; 
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentPseudonym }) => {
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentPseudonym || ''));
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const navigate = useNavigate();

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    try { await API.post(`/posts/like/${post._id}`); } catch (e) { /* rollback */ }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const { data } = await API.post('/api/ai/summarize', { text: post.content });
      setSummary(data.summary);
    } catch (error) { toast.error("AI is busy."); } 
    finally { setIsSummarizing(false); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success("Link copied to clipboard");
  };

  const isLongPost = post.content.length > 500;

  return (
    <Card className="mb-6 overflow-hidden glass-card border-none shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-0">
        <div className="p-5 flex space-x-4">
          <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
            <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold font-sans">
              {post.pseudonym[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-foreground/90">{post.pseudonym}</span>
                   {post.pseudonym !== currentPseudonym && (
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-primary/80 hover:bg-primary/10 rounded-full" onClick={() => navigate('/chat', { state: { contact: post.pseudonym } })}>
                       <Send className="w-3 h-3" />
                     </Button>
                   )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>

              {/* ✅ Three Dots Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-border/50">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" /> Copy Link
                  </DropdownMenuItem>
                  {post.pseudonym !== currentPseudonym && (
                    <>
                      <DropdownMenuItem className="cursor-pointer text-orange-500 focus:text-orange-500">
                        <EyeOff className="mr-2 h-4 w-4" /> Mute @{post.pseudonym}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                        <AlertTriangle className="mr-2 h-4 w-4" /> Report Whisper
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Content with nicer typography */}
            <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal break-words">
              {post.content}
            </div>

            {/* AI Summary */}
            {isLongPost && !summary && !isSummarizing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <Button onClick={handleSummarize} variant="secondary" size="sm" className="bg-primary/5 text-primary hover:bg-primary/10 h-7 text-xs font-medium">
                  <Sparkles className="w-3 h-3 mr-1.5" /> Summarize
                </Button>
              </motion.div>
            )}

            {isSummarizing && (
               <div className="mt-3 p-3 rounded-xl bg-muted/20 border border-border/40 space-y-2">
                 <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary animate-pulse" /><span className="text-xs text-primary/70">Analyzing...</span></div>
                 <Skeleton className="h-2 w-3/4 bg-primary/5" />
               </div>
            )}

            <AnimatePresence>
              {summary && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-primary/10">
                  <p className="text-sm italic text-foreground/80">"{summary}"</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Media Polish */}
            {post.media && post.media.type !== 'none' && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                {post.media.type === 'image' ? (
                  <img src={post.media.url} alt="Content" className="w-full h-auto max-h-[500px] object-cover bg-muted" />
                ) : (
                  <div className="p-4 bg-muted/30"><audio controls src={post.media.url} className="w-full" /></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-3 border-t border-border/30 flex justify-between items-center bg-muted/5">
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className={`h-8 px-2 gap-1.5 ${isLiked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`} onClick={handleLike}>
              <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-current' : ''}`} /> <span className="text-xs font-medium">{likes}</span>
            </Button>
            <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-blue-500">
                        <MessageCircle className="h-4.5 w-4.5" /><span className="text-xs font-medium">{post.comments.length}</span>
                    </Button>
                </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        
        <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <CollapsibleContent className="bg-muted/10 border-t border-border/30">
                {/* Comments - Emoji Picker removed via prop or internal logic if needed */}
                <CommentSection comments={post.comments} postId={post._id} /> 
            </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};