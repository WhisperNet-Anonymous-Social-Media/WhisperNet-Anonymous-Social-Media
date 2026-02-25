import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Clock, Sparkles, Send, Copy, AlertTriangle, Trash2, Repeat, Bookmark, BarChart3, Pin, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import API from '@/api';
import { CommentSection } from './CommentSection'; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { optimizeCloudinaryMediaUrl } from '@/lib/media';

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  media?: { url: string; type: string };
  poll?: {
    question: string;
    options: Array<{ text: string; voters: string[] }>;
  };
  likes: string[]; 
  impressions?: number;
  comments: any[];
  reshares?: string[]; // ✅ Added
  bookmarks?: string[]; // ✅ Added
  createdAt: string;
  isRetweet?: boolean;
  originalPost?: Post;
}

interface PostCardProps {
  post: Post;
  currentPseudonym?: string;
  onDelete?: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  hideMedia?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentPseudonym, onDelete, isPinned, onTogglePin, onTagClick, hideMedia }) => {
  // Use original post if it's a reshare
  const displayPost = post.isRetweet && post.originalPost ? post.originalPost : post;
  const isReshareWrapper = post.isRetweet; // To check if THIS card is the reshare wrapper
  
  const [likes, setLikes] = useState(displayPost.likes.length);
  const [isLiked, setIsLiked] = useState(displayPost.likes.includes(currentPseudonym || ''));
  const [impressions, setImpressions] = useState(displayPost.impressions || 0);
  const [likePulse, setLikePulse] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(displayPost.bookmarks?.includes(currentPseudonym || '') || false);
  
  // ✅ Check global reshares on the displayPost
  const [isReshared, setIsReshared] = useState(displayPost.reshares?.includes(currentPseudonym || '') || false);
  
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [poll, setPoll] = useState(displayPost.poll);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const navigate = useNavigate();

  const handleLike = async () => {
    setLikePulse(true);
    setTimeout(() => setLikePulse(false), 220);
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    try { await API.post(`/posts/like/${displayPost._id}`); } catch (e) { /* rollback */ }
  };

  const wordsCount = useMemo(() => {
    return (displayPost.content || "").trim().split(/\s+/).filter(Boolean).length;
  }, [displayPost.content]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordsCount / 180));
  }, [wordsCount]);

  const handleReshare = async () => {
    if (isReshared) return; // Simple prevent double reshare for now
    setIsReshared(true);
    toast.success("Whisper reshared on your profile");
    try { await API.post(`/posts/retweet/${displayPost._id}`); } catch (e) { 
        setIsReshared(false);
        toast.error("Failed to reshare");
    }
  };

  const handleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    try { await API.post(`/posts/bookmark/${displayPost._id}`); } catch (e) { /* rollback */ }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this whisper?")) {
      try {
        // ✅ Delete the post ID of the CARD (whether it's a wrapper or original)
        await API.delete(`/posts/${post._id}`);
        toast.success("Whisper deleted.");
        if (onDelete) onDelete(post._id);
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete post.");
      }
    }
  };

  const handleReport = async () => {
    try {
        await API.post(`/posts/report/${displayPost._id}`);
        toast.success("Post reported. Admins will review it.");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to report.");
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null); // Clear previous summary
    try {
      const { data } = await API.post('/api/ai/summarize', { text: displayPost.content });
      setSummary(data.summary);
    } catch (error) { toast.error("AI is busy."); } 
    finally { setIsSummarizing(false); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${displayPost._id}`);
    toast.success("Link copied to clipboard");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(displayPost.content || "");
    toast.success("Post text copied");
  };

  const handleMuteUser = () => {
    const key = "whispernet_muted_users";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const next = Array.from(new Set([...current, displayPost.pseudonym]));
    localStorage.setItem(key, JSON.stringify(next));
    toast.success(`${displayPost.pseudonym} muted`);
  };

  const handleSpeakToggle = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(displayPost.content || "");
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleVote = async (optionIndex: number) => {
    try {
      const { data } = await API.post(`/posts/vote/${displayPost._id}`, { optionIndex });
      setPoll(data.poll);
    } catch {
      toast.error("Could not submit vote");
    }
  };

  const isOwner = post.pseudonym === currentPseudonym;

  const renderContent = (text: string) => {
    return text.split(/(#[a-zA-Z0-9_]+)/g).map((part, idx) => {
      if (/^#[a-zA-Z0-9_]+$/.test(part)) {
        return (
          <button
            key={`${part}-${idx}`}
            onClick={() => onTagClick?.(part.toLowerCase())}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {part}
          </button>
        );
      }
      return <span key={`${part}-${idx}`}>{part}</span>;
    });
  };

  useEffect(() => {
    const key = `whispernet_impression_${displayPost._id}`;
    if (sessionStorage.getItem(key)) return;

    const sendImpression = async () => {
      try {
        const { data } = await API.post(`/posts/impression/${displayPost._id}`);
        if (typeof data?.impressions === "number") {
          setImpressions(data.impressions);
        }
        sessionStorage.setItem(key, "1");
      } catch (_) {}
    };
    sendImpression();
  }, [displayPost._id]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <Card className="mb-8 overflow-hidden border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-[0_18px_36px_-24px_rgba(2,6,23,0.7)] hover:border-blue-500/50 transition-all duration-300 rounded-2xl">
      <CardContent className="p-0">
        {/* Reshare Header */}
        {isReshareWrapper && (
            <div className="px-6 pt-3 pb-0 flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Repeat className="w-4 h-4" />
                <span>{post.pseudonym} reshared</span>
            </div>
        )}
        {isPinned && (
          <div className="px-6 pt-3 pb-0 flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wide">
            <Pin className="w-3.5 h-3.5" />
            Pinned
          </div>
        )}

        <div className="p-6 flex gap-5">
          <div className="relative">
             <Avatar className="h-12 w-12 border border-slate-700">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(displayPost.pseudonym || "shadow")}`} />
                <AvatarFallback className="bg-slate-800 text-slate-200 font-bold text-lg">
                {displayPost.pseudonym?.[0]}
                </AvatarFallback>
             </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100">{displayPost.pseudonym}</span>
                   {!isOwner && (
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => navigate('/chat', { state: { contact: displayPost.pseudonym } })}>
                       <Send className="w-4 h-4" />
                     </Button>
                   )}
                </div>
                <div className="flex items-center text-sm text-slate-500 mt-0.5">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: true })}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100 rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-300 p-2 w-48">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                    <Copy className="mr-3 h-4 w-4" /> Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyText} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                    <Copy className="mr-3 h-4 w-4" /> Copy Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSpeakToggle} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                    {isSpeaking ? <VolumeX className="mr-3 h-4 w-4" /> : <Volume2 className="mr-3 h-4 w-4" />}
                    {isSpeaking ? "Stop Read Aloud" : "Read Aloud"}
                  </DropdownMenuItem>
                  
                  {isOwner ? (
                    <>
                      {onTogglePin && (
                        <DropdownMenuItem onClick={() => onTogglePin(post._id)} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                        <Pin className="mr-3 h-4 w-4" /> {isPinned ? "Unpin Whisper" : "Pin Whisper"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-500/10 py-2.5 rounded-md">
                          <Trash2 className="mr-3 h-4 w-4" /> Delete Whisper
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/chat', { state: { contact: displayPost.pseudonym } })} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                        <Send className="mr-3 h-4 w-4" /> Message User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMuteUser} className="cursor-pointer focus:bg-slate-800 py-2.5 rounded-md">
                        <AlertTriangle className="mr-3 h-4 w-4" /> Mute User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-500/10 py-2.5 rounded-md">
                        <AlertTriangle className="mr-3 h-4 w-4" /> Report Whisper
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5">
                <BookOpen className="h-3 w-3" /> {readingTimeMinutes} min read
              </span>
              <span>{wordsCount} words</span>
            </div>
            <div className="mt-4 text-[17px] leading-8 text-slate-200 whitespace-pre-wrap font-normal break-words" onDoubleClick={handleLike} title="Double click to like">
              {renderContent(displayPost.content || "")}
            </div>

            {/* ✅ AI Summary Logic - Fixed */}
            {displayPost.content && displayPost.content.length > 500 && (
                <div className="mt-4">
                     {/* Show button if no summary AND not loading */}
                     {!summary && !isSummarizing && (
                         <Button onClick={handleSummarize} variant="secondary" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-100 h-8 px-3 text-xs border border-blue-200">
                            <Sparkles className="w-3.5 h-3.5 mr-2" /> AI Summarize
                         </Button>
                     )}

                     {/* Show Loading State */}
                     {isSummarizing && (
                         <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 w-full max-w-md space-y-2">
                             <Skeleton className="h-3 w-40 bg-blue-100" />
                             <Skeleton className="h-3 w-full bg-blue-100" />
                             <Skeleton className="h-3 w-4/5 bg-blue-100" />
                         </div>
                     )}

                     {/* Show Result */}
                     <AnimatePresence>
                        {summary && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-blue-950/35 border border-blue-500/30">
                                <p className="text-sm italic text-slate-200">"{summary}"</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {!hideMedia && displayPost.media && displayPost.media.type !== 'none' && (
              <div className="mt-5 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-sm">
                {displayPost.media.type === 'image' ? (
                  <img loading="lazy" decoding="async" src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} alt="Content" className="w-full h-auto max-h-[600px] object-cover" />
                ) : displayPost.media.type === 'video' ? (
                  <video controls autoPlay muted loop playsInline preload="metadata" src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} className="w-full max-h-[600px] object-cover" />
                ) : (
                  <div className="p-4"><audio controls preload="metadata" src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} className="w-full" /></div>
                )}
              </div>
            )}

            {poll?.question && (
              <div className="mt-4 rounded-xl border border-blue-500/40 bg-blue-950/25 p-4 space-y-3">
                <p className="font-semibold text-slate-100">{poll.question}</p>
                {poll.options.map((option, idx) => {
                  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0);
                  const votes = option.voters?.length || 0;
                  const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                  const voted = !!option.voters?.includes(currentPseudonym || "");
                  return (
                    <button
                      key={`${option.text}-${idx}`}
                      onClick={() => handleVote(idx)}
                      className={`w-full text-left rounded-lg border px-3 py-2 ${voted ? "border-blue-500/50 bg-blue-500/20" : "border-slate-700 bg-slate-950"}`}
                    >
                      <div className="flex justify-between text-sm text-slate-300">
                        <span>{option.text}</span>
                        <span>{votes} ({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center bg-slate-950/50">
           <div className="flex gap-8">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-9 px-3 gap-2 hover:bg-slate-800 text-base ${isLiked ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`} 
                    onClick={handleLike}
                >
                    <motion.span
                      animate={likePulse ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.22 }}
                      className="inline-flex"
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.span>
                    <span>{likes}</span>
                </Button>

                <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 text-base">
                            <MessageCircle className="h-5 w-5" />
                            <span>{displayPost.comments.length}</span>
                        </Button>
                    </CollapsibleTrigger>
                </Collapsible>
                
                {/* ✅ Reshare Button - Green if reshared */}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-9 px-3 gap-2 hover:bg-slate-800 text-base ${isReshared ? 'text-green-400' : 'text-slate-500 hover:text-green-400'}`} 
                    onClick={handleReshare}
                >
                    <Repeat className="h-5 w-5" />
                </Button>

                <div className="h-9 px-3 gap-2 inline-flex items-center text-base text-slate-500">
                  <BarChart3 className="h-5 w-5" />
                  <span>{impressions}</span>
                </div>
           </div>
           
           <div>
               <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-9 px-3 hover:bg-slate-800 ${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`} 
                    onClick={handleBookmark}
                >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
               </Button>
           </div>
        </div>
        
        <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <CollapsibleContent className="bg-slate-950 border-t border-slate-700">
                <CommentSection comments={displayPost.comments} postId={displayPost._id} /> 
            </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
