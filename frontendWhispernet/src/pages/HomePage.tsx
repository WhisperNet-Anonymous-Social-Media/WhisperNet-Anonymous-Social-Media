import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/CreatePostForm';
import { PostCard } from '@/components/PostCard';
import API from '@/api';
import { Loader2 } from 'lucide-react';
import { useSocket } from '@/hooks/usesocket';
import { useAuth } from '@/context/AuthContext';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const res = await API.get("/posts/feed");
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("new_post", (newPost: any) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => {
      socket.off("new_post");
    };
  }, [socket]);

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Campus Feed</h1>
        <p className="text-muted-foreground">See what's happening anonymously.</p>
      </div>

      <CreatePostForm />

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post} currentPseudonym={user?.pseudonym} />
          ))
        )}
      </div>
    </div>
  );
};