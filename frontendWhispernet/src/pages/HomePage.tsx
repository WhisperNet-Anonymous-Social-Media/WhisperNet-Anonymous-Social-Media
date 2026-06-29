import React, { useEffect, useMemo, useState } from 'react';
import API from '@/api';
import { CreatePostForm } from '@/components/CreatePostForm';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  comments: any[];
  impressions?: number;
  createdAt: string;
  isRetweet?: boolean;
  originalPost?: Post;
}

export const HomePage: React.FC = () => {
  const PINNED_KEY = 'whispernet_pinned_post_id';
  const MUTED_WORDS_KEY = 'whispernet_muted_words';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<'latest' | 'top'>('latest');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'poll' | 'text'>('all');
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(() => localStorage.getItem(PINNED_KEY));
  const [mutedWords, setMutedWords] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(MUTED_WORDS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [newMutedWord, setNewMutedWord] = useState('');
  const [hideMediaMode, setHideMediaMode] = useState(false);
  const [hideReshares, setHideReshares] = useState(false);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);

  const currentUser = JSON.parse(atob(localStorage.getItem('whispernet_token')?.split('.')[1] || '{}'));
  const socket = useSocket();
  const mutedUsers = JSON.parse(localStorage.getItem('whispernet_muted_users') || '[]') as string[];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await API.get('/posts/feed');
        setPosts((data || []).filter((p: Post) => !mutedUsers.includes(p.pseudonym)));
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_post', (newPost: Post) => {
      if (mutedUsers.includes(newPost.pseudonym)) return;
      setPendingPosts((prev) => [newPost, ...prev].slice(0, 40));
    });
    return () => {
      socket.off('new_post');
    };
  }, [socket, mutedUsers]);

  const flushPendingPosts = () => {
    if (!pendingPosts.length) return;
    setPosts((prev) => [...pendingPosts, ...prev]);
    setPendingPosts([]);
    toast.success(`${pendingPosts.length} new whisper${pendingPosts.length > 1 ? 's' : ''} loaded`);
  };

  const handleCreatePost = async (formData: any) => {
    setIsSubmitting(true);
    try {
      await API.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Whisper posted anonymously!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to post.';
      toast.error('Blocked by Guard', { description: errorMessage, duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const hashtagCounts = useMemo(() => posts.reduce<Record<string, number>>((acc, post) => {
    const tags = (post.content || '').match(/#[a-z0-9_]+/gi) || [];
    tags.forEach((t) => {
      const key = t.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {}), [posts]);
  const topTags = useMemo(() => Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5), [hashtagCounts]);

  const shadowCounts = useMemo(() => posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.pseudonym] = (acc[post.pseudonym] || 0) + 1;
    return acc;
  }, {}), [posts]);
  const topShadows = useMemo(() => Object.entries(shadowCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5), [shadowCounts]);

  const filteredByTag = posts.filter((p) =>
    activeTag ? (p.content || '').toLowerCase().includes(activeTag.toLowerCase()) : true
  );

  const searchFiltered = filteredByTag.filter((p) => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return (
      String(p.content || '').toLowerCase().includes(term) ||
      String(p.pseudonym || '').toLowerCase().includes(term)
    );
  });

  const mediaTypeFiltered = searchFiltered.filter((p) => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'poll') return !!p.poll?.question;
    if (mediaFilter === 'text') return (!p.media || p.media.type === 'none') && !p.poll?.question;
    return p.media?.type === mediaFilter;
  });

  const keywordFiltered = mediaTypeFiltered.filter((p) => {
    const text = String(p.content || '').toLowerCase();
    return !mutedWords.some((w) => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
    });
  });

  const modeFiltered = keywordFiltered.filter((p) => !(hideReshares && p.isRetweet));

  const visiblePosts =
    sortMode === 'latest'
      ? modeFiltered
      : [...modeFiltered].sort((a: any, b: any) => {
          const aScore = (a.impressions || 0) + (a.likes?.length || 0) * 3 + (a.comments?.length || 0) * 4;
          const bScore = (b.impressions || 0) + (b.likes?.length || 0) * 3 + (b.comments?.length || 0) * 4;
          return bScore - aScore;
        });

  const finalPosts = [
    ...visiblePosts.filter((p) => pinnedPostId && p._id === pinnedPostId),
    ...visiblePosts.filter((p) => !pinnedPostId || p._id !== pinnedPostId),
  ];

  const togglePinPost = (postId: string) => {
    setPinnedPostId((prev) => {
      const next = prev === postId ? null : postId;
      if (next) localStorage.setItem(PINNED_KEY, next);
      else localStorage.removeItem(PINNED_KEY);
      return next;
    });
  };

  const addMutedWord = () => {
    const word = newMutedWord.trim().toLowerCase();
    if (!word || mutedWords.includes(word)) return;
    const next = [...mutedWords, word].slice(0, 30);
    setMutedWords(next);
    localStorage.setItem(MUTED_WORDS_KEY, JSON.stringify(next));
    setNewMutedWord('');
  };

  const removeMutedWord = (word: string) => {
    const next = mutedWords.filter((w) => w !== word);
    setMutedWords(next);
    localStorage.setItem(MUTED_WORDS_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen">
      <div className="professional-panel p-5 mb-5 flex items-center justify-between bg-slate-900/75 border-slate-700">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
          <p className="text-2xl font-semibold text-slate-100 tracking-tight">{currentUser?.pseudonym || 'Shadow'}</p>
          <p className="text-sm text-slate-500 mt-1">Your anonymous voice is live now.</p>
        </div>
        <img
          src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(currentUser?.pseudonym || 'shadow')}`}
          alt="Avatar"
          className="w-16 h-16 rounded-full border border-slate-700 bg-slate-950 shadow-[0_10px_20px_-12px_rgba(2,6,23,0.65)]"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_360px] gap-7">
        <section>
          <CreatePostForm onSubmit={handleCreatePost} isSubmitting={isSubmitting} />
          <div className="mt-10">
            <div className="mb-6 px-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold flex items-center gap-3 tracking-tight text-slate-100">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Global Whispers
              </h2>
              <div className="inline-flex rounded-full border border-slate-700 p-1 bg-slate-950/60">
                <Button size="sm" variant={sortMode === 'latest' ? 'default' : 'ghost'} className="rounded-full" onClick={() => setSortMode('latest')}>
                  Latest
                </Button>
                <Button size="sm" variant={sortMode === 'top' ? 'default' : 'ghost'} className="rounded-full" onClick={() => setSortMode('top')}>
                  Top
                </Button>
              </div>
            </div>

            <div className="mb-4 px-2 flex flex-wrap gap-2">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search whispers or pseudonyms..."
                className="flex-1 min-w-[240px] rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 outline-none"
              />
              {(['all', 'image', 'video', 'audio', 'poll', 'text'] as const).map((type) => (
                <Button key={type} size="sm" variant={mediaFilter === type ? 'default' : 'secondary'} onClick={() => setMediaFilter(type)}>
                  {type}
                </Button>
              ))}
            </div>

            {pendingPosts.length > 0 && (
              <div className="mb-4 px-2">
                <Button onClick={flushPendingPosts} className="rounded-full">
                  Show {pendingPosts.length} new whisper{pendingPosts.length > 1 ? 's' : ''}
                </Button>
              </div>
            )}

            {activeTag && (
              <div className="mb-4 px-2">
                <Button size="sm" variant="secondary" onClick={() => setActiveTag(null)}>
                  Clear tag filter: {activeTag}
                </Button>
              </div>
            )}

            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-6 space-y-3 p-6 bg-slate-900 rounded-2xl border border-slate-700 shadow-sm">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-slate-700" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px] bg-slate-700" />
                          <Skeleton className="h-4 w-[150px] bg-slate-800" />
                        </div>
                      </div>
                      <Skeleton className="h-32 w-full rounded-xl bg-slate-800" />
                    </div>
                  ))
              : finalPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentPseudonym={currentUser?.pseudonym}
                    onDelete={handleDeletePost}
                    isPinned={pinnedPostId === post._id}
                    onTogglePin={togglePinPost}
                    onTagClick={(tag) => setActiveTag(tag)}
                    hideMedia={hideMediaMode}
                  />
                ))}
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 self-start pr-1 h-fit">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="professional-panel p-5 bg-black/80 border-slate-800"
          >
            <h3 className="text-base font-semibold uppercase tracking-widest text-slate-400 mb-4">Trending Tags</h3>
            {topTags.length ? (
              <div className="space-y-2">
                {topTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className="w-full flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 border border-slate-800 hover:border-blue-500/40 transition-colors"
                  >
                    <span className="text-slate-200 text-[15px]">{tag}</span>
                    <span className="text-xs text-blue-400">{count} whispers</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No trending tags yet.</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="professional-panel p-5 bg-black/80 border-slate-800"
          >
            <h3 className="text-base font-semibold uppercase tracking-widest text-slate-400 mb-4">Active Shadows</h3>
            {topShadows.length ? (
              <div className="space-y-2">
                {topShadows.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 border border-slate-800">
                    <span className="text-slate-200 truncate text-[15px]">{name}</span>
                    <span className="text-xs text-emerald-400">{count} posts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No activity yet.</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.14 }}
            className="professional-panel p-5 bg-black/80 border-slate-800"
          >
            <h3 className="text-base font-semibold uppercase tracking-widest text-slate-400 mb-4">Content Controls</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={newMutedWord}
                onChange={(e) => setNewMutedWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMutedWord()}
                placeholder="Mute keyword..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
              />
              <Button size="sm" onClick={addMutedWord}>
                Add
              </Button>
            </div>
            {mutedWords.length ? (
              <div className="flex flex-wrap gap-2">
                {mutedWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => removeMutedWord(word)}
                    className="text-xs rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300 hover:border-red-500/50"
                  >
                    {word} ×
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No muted words yet.</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant={hideMediaMode ? 'default' : 'secondary'} onClick={() => setHideMediaMode((v) => !v)}>
                {hideMediaMode ? 'Media Hidden' : 'Hide Media'}
              </Button>
              <Button size="sm" variant={hideReshares ? 'default' : 'secondary'} onClick={() => setHideReshares((v) => !v)}>
                {hideReshares ? 'Reshares Hidden' : 'Hide Reshares'}
              </Button>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
};
