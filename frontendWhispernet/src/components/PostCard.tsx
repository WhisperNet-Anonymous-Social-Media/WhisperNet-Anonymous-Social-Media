import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Flag, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import API from '@/api';
import { CommentSection } from './CommentSection'; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  const handleLike = async () => {
    const previousLikes = likes;
    const previousIsLiked = isLiked;

    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    try {
      await API.post(`/posts/like/${post._id}`);
    } catch (error) {
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 flex space-x-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              {post.pseudonym[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">{post.pseudonym}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {post.media && post.media.type !== 'none' && (
              <div className="mt-3 rounded-lg overflow-hidden border bg-black/5">
                {post.media.type === 'image' ? (
                  <img src={post.media.url} alt="Post content" className="w-full h-auto max-h-96 object-contain" />
                ) : (
                  <div className="p-2">
                    <audio controls src={post.media.url} className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2 bg-muted/10 border-t flex justify-between items-center">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" size="sm" 
              className={`space-x-1 hover:text-pink-500 ${isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <motion.div whileTap={{ scale: 0.8 }} animate={isLiked ? { scale: [1, 1.2, 1] } : {}}>
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </motion.div>
              <span>{likes}</span>
            </Button>

            <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="space-x-1 text-muted-foreground hover:text-blue-500">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.comments.length}</span>
                    </Button>
                </CollapsibleTrigger>
            </Collapsible>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
        
        <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <CollapsibleContent className="px-4 pb-4 bg-muted/5 border-t">
                <CommentSection comments={post.comments} postId={post._id} /> 
            </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};