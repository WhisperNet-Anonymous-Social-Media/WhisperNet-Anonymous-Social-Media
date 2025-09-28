import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/PostCard';
import API from '@/api';
import { MessageSquare, ArrowUp } from 'lucide-react';

// ---- Match backend ----
interface Post {
  _id: string;
  pseudonym: string;
  content: string;
  likes: number; // ✅ backend returns count of likes
  comments: {
    pseudonym: string;
    comment: string;
    createdAt: string;
  }[];
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  pseudonym: string;   // ✅ always set after OTP
  verified: boolean;   // ✅ backend flag
}

export const AccountPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userWhispers, setUserWhispers] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccount = async () => {
    try {
      const token = localStorage.getItem("whispernet_token");
      if (!token) {
        console.error("No token found in localStorage");
        setLoading(false);
        return;
      }

      const res = await API.get("/account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Account response:", res.data);
      setCurrentUser(res.data);

      // Fetch all posts and filter by pseudonym
      const postsRes = await API.get("/posts/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userPosts = postsRes.data.filter(
        (post: Post) => post.pseudonym === res.data.pseudonym
      );
      setUserWhispers(userPosts);
    } catch (err) {
      console.error("Error fetching account:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleUpdateWhisper = (id: string, updates: Partial<Post>) => {
    setUserWhispers(prev =>
      prev.map(post =>
        post._id === id ? { ...post, ...updates } : post
      )
    );
  };

  const totalUpvotes = userWhispers.reduce((acc, post) => acc + post.likes, 0);

  if (loading) {
    return <div className="text-center py-20">Loading account...</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No account data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* User card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-muted h-24" />
          <CardContent className="p-6 pt-0">
            <div className="flex items-end -mt-12">
              <Avatar className="w-24 h-24 border-4 border-background bg-background">
                <AvatarImage src="/default-avatar.png" />
                <AvatarFallback className="text-3xl">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold">
                {currentUser.pseudonym}
              </h2>
              <Badge variant="secondary" className="mt-1">
                {currentUser.verified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <div className="mt-4 flex space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                <span className="font-semibold text-foreground mr-1">
                  {userWhispers.length}
                </span>
                Whispers
              </div>
              <div className="flex items-center">
                <ArrowUp className="w-4 h-4 mr-1.5" />
                <span className="font-semibold text-foreground mr-1">
                  {totalUpvotes}
                </span>
                Upvotes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Your Whispers
          </h3>
          {userWhispers.length > 0 ? (
            userWhispers.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onUpdatePost={handleUpdateWhisper}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You haven't whispered anything yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
