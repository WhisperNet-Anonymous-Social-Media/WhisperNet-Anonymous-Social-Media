import React, { useEffect, useState } from 'react';
import API from '@/api';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  media?: { url: string; type: string };
  poll?: { question: string; options: Array<{ text: string; voters: string[] }> };
  likes: string[];
  comments: any[];
  reshares?: string[];
  bookmarks?: string[];
  createdAt: string;
}

export const BookmarksPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(atob(localStorage.getItem('whispernet_token')?.split('.')[1] || '{}'));

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data } = await API.get('/posts/bookmarks');
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch bookmarks");
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 px-2">
         <Bookmark className="w-8 h-8 text-yellow-500" />
         <h1 className="text-2xl font-bold">Your Bookmarks</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
             <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
             <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
        </div>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <PostCard 
            key={post._id} 
            post={post} 
            currentPseudonym={currentUser?.pseudonym} 
            onDelete={handleDeletePost}
          />
        ))
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
           <p className="text-muted-foreground">No bookmarks yet.</p>
        </div>
      )}
    </div>
  );
};
