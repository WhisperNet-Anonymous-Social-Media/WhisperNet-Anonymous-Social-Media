import React, { useEffect, useState } from 'react';
import API from '@/api';
import { CreatePostForm } from '@/components/CreatePostForm';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  media?: { url: string; type: string };
  likes: string[];
  comments: any[];
  createdAt: string;
}

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const socket = useSocket();

  // Load Feed
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await API.get('/posts/feed');
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch feed");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;
    socket.on("new_post", (newPost: Post) => {
      setPosts((prev) => [newPost, ...prev]);
      toast.info("Someone just whispered...");
    });
    return () => { socket.off("new_post"); };
  }, [socket]);

  // Handle Create Post
  const handleCreatePost = async (formData: any) => {
    setIsSubmitting(true);
    try {
      await API.post('/posts/create', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Whisper posted anonymously!");
      // Socket handles the update, no need to manually add
    } catch (error: any) {
        if(error.response?.data?.error) {
            toast.error(error.response.data.error); // AI Guard Block
        } else {
            toast.error("Failed to post.");
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ✅ Applied animated-bg here
    <div className="min-h-screen animated-bg">
      <div className="max-w-2xl mx-auto py-8 px-4">
        
        {/* Create Post */}
        <CreatePostForm onSubmit={handleCreatePost} isSubmitting={isSubmitting} />
        
        {/* Feed */}
        <div className="space-y-6 mt-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-3 p-4 bg-background/50 rounded-xl border border-border/50">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            ))
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                currentPseudonym={JSON.parse(atob(localStorage.getItem('whispernet_token')?.split('.')[1] || '{}')).pseudonym} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};