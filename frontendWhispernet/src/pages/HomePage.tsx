import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/CreatePostForm';
import { PostCard } from '@/components/PostCard';
import API from '@/api';
import { Ghost } from 'lucide-react';

interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  likes: number;
  comments: {
    pseudonym: string;
    comment: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from backend
// inside fetchPosts
const fetchPosts = async () => {
  try {
    const token = localStorage.getItem("whispernet_token");
    const res = await API.get("/posts/feed", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Posts from backend:", res.data);
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

  // Add a new post locally after creation
  const handleCreatePost = () => {
    fetchPosts(); // refresh feed after creating post
  };

  // Update a post locally (after like/comment)
  const handleUpdatePost = (id: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post =>
        post._id === id ? { ...post, ...updates } : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Your Campus Community
          </h2>
          <p className="text-muted-foreground text-lg">
            Share your thoughts anonymously and connect with fellow students.
          </p>
        </div>

        {/* Create Post Form */}
        <CreatePostForm onCreatePost={handleCreatePost} />

        {/* Feed Section */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-20">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Ghost className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No whispers yet
              </h3>
              <p className="text-base text-muted-foreground">
                Be the first to share something with your campus!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Campus Whispers
                </h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{posts.length} whisper{posts.length !== 1 ? 's' : ''} live</span>
                </div>
              </div>

              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdatePost={handleUpdatePost}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p className="font-semibold">WhisperNet</p>
          <p className="mt-1">Remember to keep conversations respectful and constructive.</p>
        </div>
      </div>
    </div>
  );
};
