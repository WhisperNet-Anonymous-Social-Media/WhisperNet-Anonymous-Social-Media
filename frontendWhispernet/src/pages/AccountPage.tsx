import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCard } from '@/components/PostCard';
import API from '@/api';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  media?: { url: string; type: string };
  poll?: { question: string; options: Array<{ text: string; voters: string[] }> };
  likes: any[]; 
  comments: any[];
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  pseudonym: string;
  verified: boolean;
}

export const AccountPage: React.FC = () => {
  const PINNED_KEY = "whispernet_pinned_post_id";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userWhispers, setUserWhispers] = useState<Post[]>([]);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(() => localStorage.getItem(PINNED_KEY));
  const [loading, setLoading] = useState(true);

  const fetchAccount = async () => {
    try {
      const token = localStorage.getItem("whispernet_token");
      if (!token) return;

      const res = await API.get("/account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);

      const postsRes = await API.get("/posts/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const myPosts = postsRes.data.filter((p: Post) => p.pseudonym === res.data.pseudonym);
      setUserWhispers(myPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccount(); }, []);

  // Calculate stats
  const totalLikes = userWhispers.reduce((acc, post) => acc + (post.likes?.length || 0), 0);
  const sortedWhispers = [
    ...userWhispers.filter((p) => pinnedPostId && p._id === pinnedPostId),
    ...userWhispers.filter((p) => !pinnedPostId || p._id !== pinnedPostId),
  ];

  const togglePinPost = (postId: string) => {
    setPinnedPostId((prev) => {
      const next = prev === postId ? null : postId;
      if (next) localStorage.setItem(PINNED_KEY, next);
      else localStorage.removeItem(PINNED_KEY);
      return next;
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Summoning profile...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 🎭 Profile Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
        {/* Abstract Cover */}
        <div className="h-44 md:h-48 bg-gradient-to-r from-slate-950 via-blue-950 to-black relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
        </div>

        <div className="relative px-4 md:px-8 pb-6 md:pb-8 -mt-14 md:-mt-16 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
           {/* Avatar */}
           <div className="relative group">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-slate-900 shadow-xl rounded-2xl">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(currentUser?.pseudonym || "shadow")}`} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-4xl font-bold text-white">
                    {currentUser?.pseudonym?.[0]}
                </AvatarFallback>
              </Avatar>
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-xs px-2 py-1 rounded-full border border-slate-700 text-white/80">
                  Anonymous
              </div>
           </div>

           {/* Info */}
           <div className="flex-1 space-y-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                 {currentUser?.pseudonym}
                 {currentUser?.verified && <ShieldCheck className="w-6 h-6 text-cyan-400" />}
              </h1>
              <p className="text-slate-400 text-sm max-w-md">
                 Identity hidden. Voice verified. Revealing the unseen since 2026.
              </p>
           </div>

           {/* Stats Cards */}
           <div className="flex gap-3 md:gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-xl bg-white/5 border border-slate-700 backdrop-blur-md text-center">
                  <div className="text-2xl font-bold text-white">{userWhispers.length}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Whispers</div>
              </div>
              <div className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-xl bg-white/5 border border-slate-700 backdrop-blur-md text-center">
                  <div className="text-2xl font-bold text-pink-500">{totalLikes}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Karma</div>
              </div>
           </div>
        </div>
      </div>

      {/* 📝 Post List */}
      <div className="max-w-2xl mx-auto">
         <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-100">Your Shadows</h2>
         </div>

         {userWhispers.length > 0 ? (
            <div className="space-y-6">
                {sortedWhispers.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    currentPseudonym={currentUser?.pseudonym} 
                    isPinned={pinnedPostId === post._id}
                    onTogglePin={togglePinPost}
                  />
                ))}
            </div>
         ) : (
            <div className="text-center py-20 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                <p className="text-slate-400">You haven't whispered into the void yet.</p>
            </div>
         )}
      </div>
    </div>
  );
};
