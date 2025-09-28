import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import API from '@/api'; 
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronUp, ChevronDown, MessageCircle, Heart, MoreHorizontal, Flag, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CommentSection } from './CommentSection';

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

interface PostCardProps {
  post: Post;
  onUpdatePost: (id: string, updates: Partial<Post>) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost }) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { toast } = useToast();

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // handleLike
const handleLike = async () => {
  try {
    const token = localStorage.getItem("whispernet_token");
    const res = await API.post(
      `/posts/like/${post._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onUpdatePost(post._id, { likes: res.data.likes });
  } catch (err) {
    console.error("Error liking post:", err);
  }
};

  const handleReport = () => {
    setReportDialogOpen(false);
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe. We'll review this post shortly.",
    });
  };

  // handleAddComment
const handleAddComment = async (content: string) => {
  try {
    const token = localStorage.getItem("whispernet_token");
    const res = await API.post(
      `/posts/comment/${post._id}`,
      { comment: content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onUpdatePost(post._id, { comments: res.data.comments });
  } catch (err) {
    console.error("Error adding comment:", err);
  }
};

  return (
    <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen} className="mb-4">
      <Card className="shadow-md border border-border/50 bg-card hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-4 mb-4">
            <Avatar className="w-12 h-12 border-2 border-border/30">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                {post.pseudonym.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-foreground truncate text-base">
                  {post.pseudonym}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1.5" />
                {formatTimeAgo(post.createdAt)}
              </div>
            </div>

            {/* Report */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Flag className="w-5 h-5 mr-2 text-destructive" />
                    Report Post
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to report this post?
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/50 rounded-lg p-4 my-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    "{post.content}"
                  </p>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReport}>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base">
              {post.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-9 px-3">
                <ChevronUp className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3">
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-primary hover:bg-accent">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold ml-1.5">{post.comments.length}</span>
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="sm" onClick={handleLike}
                className="h-9 px-3 text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10">
                <Heart className="h-5 w-5" />
<span className="text-sm font-semibold ml-1.5">{post.likes}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <CollapsibleContent className="py-2">
        <CommentSection comments={post.comments} onAddComment={handleAddComment} />
      </CollapsibleContent>
    </Collapsible>
  );
};
