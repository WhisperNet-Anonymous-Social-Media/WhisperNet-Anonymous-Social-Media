import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader as Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API from '@/api';

interface CreatePostFormProps {
  onCreatePost: (content: string) => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onCreatePost }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Empty whisper",
        description: "Please write something before whispering.",
        variant: "destructive",
      });
      return;
    }

    if (content.trim().length < 10) {
      toast({
        title: "Whisper too short",
        description: "Your whisper should be at least 10 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (content.trim().length > 500) {
      toast({
        title: "Whisper too long",
        description: "Your whisper should be no more than 500 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("whispernet_token");

      await API.post(
        "/posts/create",
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onCreatePost(content);
      setContent('');

      toast({
        title: "Whisper sent!",
        description: "Your anonymous whisper has been shared with the community.",
      });
    } catch (err: any) {
      console.error("Error creating post:", err);
      toast({
        title: "Error",
        description: err.response?.data || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const remainingChars = 500 - content.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <Card className="mb-6 shadow-lg border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                placeholder="What's on your mind? Share your thoughts anonymously..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[140px] resize-none border-border/50 focus:border-primary/50 transition-colors text-base p-4"
                disabled={isLoading}
                maxLength={500}
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <span
                  className={`text-sm font-medium transition-colors ${
                    isNearLimit
                      ? remainingChars <= 0
                        ? 'text-destructive'
                        : 'text-orange-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {remainingChars}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-md"></div>
                <span>Anonymous mode active</span>
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !content.trim() || content.length > 500}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Whispering...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Whisper
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
