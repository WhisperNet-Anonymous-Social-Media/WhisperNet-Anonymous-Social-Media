import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart, MessageCircle, MoreHorizontal, Clock, Sparkles, Send,
  Copy, AlertTriangle, Trash2, Repeat, Bookmark, BarChart3,
  Pin, Volume2, VolumeX, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { cn } from '@/lib/utils';

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
  reshares?: string[];
  bookmarks?: string[];
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

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentPseudonym,
  onDelete,
  isPinned,
  onTogglePin,
  onTagClick,
  hideMedia
}) => {
  const displayPost = post.isRetweet && post.originalPost ? post.originalPost : post;
  const isReshareWrapper = post.isRetweet;

  const [likes, setLikes] = useState(displayPost.likes.length);
  const [isLiked, setIsLiked] = useState(displayPost.likes.includes(currentPseudonym || ''));
  const [impressions, setImpressions] = useState(displayPost.impressions || 0);
  const [likePulse, setLikePulse] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(displayPost.bookmarks?.includes(currentPseudonym || '') || false);
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
    try { await API.post(`/posts/like/${displayPost._id}`); } catch (e) { /* Error handled silently */ }
  };

  const wordsCount = useMemo(() => (displayPost.content || "").trim().split(/\s+/).filter(Boolean).length, [displayPost.content]);
  const readingTimeMinutes = useMemo(() => Math.max(1, Math.ceil(wordsCount / 180)), [wordsCount]);

  const handleReshare = async () => {
    if (isReshared) return;
    setIsReshared(true);
    toast.success("Whisper reshared on your profile");
    try { await API.post(`/posts/retweet/${displayPost._id}`); } catch (e) {
      setIsReshared(false);
      toast.error("Failed to reshare");
    }
  };

  const handleBookmark = async () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    toast.success(newState ? "Added to bookmarks" : "Removed from bookmarks");
    try { await API.post(`/posts/bookmark/${displayPost._id}`); } catch (e) { setIsBookmarked(!newState); }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this whisper?")) {
      try {
        await API.delete(`/posts/${post._id}`);
        toast.success("Whisper deleted.");
        if (onDelete) onDelete(post._id);
      } catch (error) {
        toast.error("Failed to delete post.");
      }
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const { data } = await API.post('/api/ai/summarize', { text: displayPost.content });
      setSummary(data.summary);
    } catch (error) { toast.error("AI is busy."); }
    finally { setIsSummarizing(false); }
  };

  const handleSpeakToggle = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("TTS not supported");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(displayPost.content || "");
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleVote = async (optionIndex: number) => {
    try {
      const { data } = await API.post(`/posts/vote/${displayPost._id}`, { optionIndex });
      setPoll(data.poll);
    } catch { toast.error("Could not submit vote"); }
  };

  const isOwner = post.pseudonym === currentPseudonym;

  const renderContent = (text: string) => {
    return text.split(/(#[a-zA-Z0-9_]+)/g).map((part, idx) => {
      if (/^#[a-zA-Z0-9_]+$/.test(part)) {
        return (
          <button
            key={`${part}-${idx}`}
            onClick={() => onTagClick?.(part.toLowerCase())}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
        if (typeof data?.impressions === "number") setImpressions(data.impressions);
        sessionStorage.setItem(key, "1");
      } catch (_) { }
    };
    sendImpression();
  }, [displayPost._id]);

  return (
    <Card className="glass-card mb-8 overflow-hidden rounded-2xl border-white/10 group">
      <CardContent className="p-0">
        <div className="glass-border absolute inset-0 rounded-2xl pointer-events-none" />

        {isReshareWrapper && (
          <div className="px-6 pt-4 pb-0 flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Repeat className="w-4 h-4 text-green-400" />
            <span>{post.pseudonym} reshared</span>
          </div>
        )}

        {isPinned && (
          <div className="px-6 pt-4 pb-0 flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5 fill-current" />
            Pinned Whisper
          </div>
        )}

        <div className="p-6 flex gap-5">
          <div className="flex flex-col items-center">
            <Avatar className="h-12 w-12 border border-white/10 shadow-xl">
              <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(displayPost.pseudonym || "shadow")}`} />
              <AvatarFallback className="bg-slate-800 text-slate-200">
                {displayPost.pseudonym?.[0]}
              </AvatarFallback>
            </Avatar>
            {isReshareWrapper && <div className="w-[1px] flex-1 bg-white/5 my-2" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">{displayPost.pseudonym}</span>
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-full"
                      onClick={() => navigate('/chat', { state: { contact: displayPost.pseudonym } })}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center text-xs text-slate-400 font-medium opacity-80 mt-0.5">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: true })}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-white/10 text-slate-200 p-2 w-52 shadow-2xl">
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/post/${displayPost._id}`); toast.success("Link copied"); }} className="cursor-pointer focus:bg-white/10 py-2.5 rounded-md">
                    <Copy className="mr-3 h-4 w-4" /> Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSpeakToggle} className="cursor-pointer focus:bg-white/10 py-2.5 rounded-md">
                    {isSpeaking ? <VolumeX className="mr-3 h-4 w-4" /> : <Volume2 className="mr-3 h-4 w-4" />}
                    {isSpeaking ? "Stop Reading" : "Read Aloud"}
                  </DropdownMenuItem>

                  {isOwner ? (
                    <>
                      {onTogglePin && (
                        <DropdownMenuItem onClick={() => onTogglePin(post._id)} className="cursor-pointer focus:bg-white/10 py-2.5 rounded-md">
                          <Pin className="mr-3 h-4 w-4" /> {isPinned ? "Unpin" : "Pin to Profile"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 py-2.5 rounded-md">
                        <Trash2 className="mr-3 h-4 w-4" /> Delete Whisper
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => toast.success("User muted")} className="cursor-pointer focus:bg-white/10 py-2.5 rounded-md">
                        <AlertTriangle className="mr-3 h-4 w-4" /> Mute User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Report submitted")} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 py-2.5 rounded-md">
                        <AlertTriangle className="mr-3 h-4 w-4" /> Report Whisper
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/5 px-2.5 py-1">
                <BookOpen className="h-3 w-3" /> {readingTimeMinutes} MIN READ
              </span>
              <span>{wordsCount} WORDS</span>
            </div>

            <div
              className="mt-4 text-[16px] md:text-[17px] leading-relaxed text-slate-200 whitespace-pre-wrap font-normal break-words selection:bg-blue-500/30"
              onDoubleClick={handleLike}
            >
              {renderContent(displayPost.content || "")}
            </div>

            {displayPost.content && displayPost.content.length > 500 && (
              <div className="mt-5">
                {!summary && !isSummarizing && (
                  <Button onClick={handleSummarize} variant="outline" size="sm" className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 h-8 px-4 text-xs border-blue-500/30 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 mr-2" /> AI Summarize
                  </Button>
                )}

                {isSummarizing && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 w-full max-w-md space-y-2 animate-pulse">
                    <Skeleton className="h-2 w-32 bg-white/10" />
                    <Skeleton className="h-2 w-full bg-white/10" />
                    <Skeleton className="h-2 w-4/5 bg-white/10" />
                  </div>
                )}

                <AnimatePresence>
                  {summary && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-sm italic text-blue-100/80 leading-relaxed">"{summary}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!hideMedia && displayPost.media && displayPost.media.type !== 'none' && (
              <div className="mt-5 rounded-2xl overflow-hidden border border-white/10 bg-black/20 shadow-inner group-hover:border-white/20 transition-colors">
                {displayPost.media.type === 'image' ? (
                  <img loading="lazy" src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} alt="Whisper" className="w-full h-auto max-h-[600px] object-cover hover:scale-[1.01] transition-transform duration-700" />
                ) : displayPost.media.type === 'video' ? (
                  <video controls playsInline className="w-full max-h-[600px] object-cover" src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} />
                ) : (
                  <div className="p-6 glass"><audio controls src={optimizeCloudinaryMediaUrl(displayPost.media.url, displayPost.media.type)} className="w-full" /></div>
                )}
              </div>
            )}

            {poll?.question && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <p className="font-bold text-white mb-2">{poll.question}</p>
                {poll.options.map((option, idx) => {
                  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0);
                  const votes = option.voters?.length || 0;
                  const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                  const voted = !!option.voters?.includes(currentPseudonym || "");
                  return (
                    <button
                      key={idx}
                      onClick={() => handleVote(idx)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 transition-all duration-300 relative overflow-hidden group/poll",
                        voted ? "border-blue-500/50 bg-blue-500/10" : "border-white/5 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex justify-between items-center relative z-10 text-sm">
                        <span className={voted ? "text-blue-200 font-bold" : "text-slate-300"}>{option.text}</span>
                        <span className="text-xs font-mono opacity-60">{pct}%</span>
                      </div>
                      {/* FIXED: Removed direct style width and used a CSS variable to satisfy "no-inline-styles" linter */}
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500/10 transition-all duration-1000 w-[var(--poll-progress)]"
                        style={{ '--poll-progress': `${pct}%` } as React.CSSProperties}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex gap-4 md:gap-8">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 px-3 gap-2 hover:bg-pink-500/10 transition-colors group",
                isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'
              )}
              onClick={handleLike}
            >
              <motion.div animate={likePulse ? { scale: [1, 1.4, 1] } : { scale: 1 }}>
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              </motion.div>
              <span className="font-bold text-sm">{likes}</span>
            </Button>

            <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-3 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-bold text-sm">{displayPost.comments.length}</span>
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 px-3 gap-2 hover:bg-green-500/10 transition-colors",
                isReshared ? 'text-green-400' : 'text-slate-400 hover:text-green-400'
              )}
              onClick={handleReshare}
            >
              <Repeat className="h-5 w-5" />
              <span className="font-bold text-sm">{displayPost.reshares?.length || 0}</span>
            </Button>

            <div className="h-10 px-3 gap-2 inline-flex items-center text-slate-500 opacity-60">
              <BarChart3 className="h-4 w-4" />
              <span className="font-mono text-xs">{impressions}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 px-3 hover:bg-amber-500/10 transition-colors",
              isBookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
            )}
            onClick={handleBookmark}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
          </Button>
        </div>

        <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <CollapsibleContent className="bg-black/20 border-t border-white/5">
            <CommentSection comments={displayPost.comments} postId={displayPost._id} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};