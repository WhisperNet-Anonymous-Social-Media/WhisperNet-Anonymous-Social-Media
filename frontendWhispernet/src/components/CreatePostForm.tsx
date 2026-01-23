import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Image as ImageIcon, Mic, X, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import API from '@/api';

interface CreatePostFormProps {
  onCreatePost?: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onCreatePost }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | Blob | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'none'>('none');
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Handle Image Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaType('image');
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  // Handle Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setMediaFile(blob);
        setMediaType('audio');
        setMediaPreview(URL.createObjectURL(blob));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: Must have either text OR media
    if (!content.trim() && !mediaFile) {
        toast.warning("Please add some text or media.");
        return;
    }

    setIsLoading(true);

    try {
      let mediaData = { type: 'none', url: '', publicId: '' };

      // 2. Upload Media if exists
      if (mediaFile) {
        const formData = new FormData();
        const filename = mediaType === 'audio' ? 'voice_note.webm' : 'image.png';
        formData.append('file', mediaFile, filename);

        const uploadRes = await API.post('/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaData = uploadRes.data; 
      }

      // 3. Prepare Content (Fix for "Content Required" error)
      let finalContent = content.trim();
      if (!finalContent) {
        if (mediaData.type === 'audio') finalContent = "🎤 Voice Message";
        else if (mediaData.type === 'image') finalContent = "📷 Image";
      }

      // 4. Create Post
      await API.post("/posts/create", { 
        content: finalContent, 
        media: mediaData.type !== 'none' ? mediaData : undefined 
      });

      setContent('');
      clearMedia();
      toast.success("Whisper sent!");
      if (onCreatePost) onCreatePost();
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to post.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 shadow-md border-border/60">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="What's on your mind? Share your thoughts anonymously..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] border-none focus-visible:ring-0 resize-none text-lg p-0 placeholder:text-muted-foreground/50"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative mt-4 rounded-md overflow-hidden bg-muted/30 border border-border">
              <Button 
                type="button" variant="destructive" size="icon" 
                className="absolute top-2 right-2 h-6 w-6 rounded-full z-10"
                onClick={clearMedia}
              >
                <X className="h-3 w-3" />
              </Button>
              
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="max-h-64 w-full object-cover" />
              ) : (
                <div className="p-4 flex items-center justify-center">
                  <audio controls src={mediaPreview} className="w-full" />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-2 border-t">
            <div className="flex gap-2">
              <input 
                type="file" ref={fileInputRef} className="hidden" 
                accept="image/*" onChange={handleFileSelect} 
              />
              <Button 
                type="button" variant="ghost" size="icon" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              <Button 
                type="button" variant="ghost" size="icon"
                className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </div>

            <Button type="submit" disabled={isLoading} className="font-semibold">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Whisper
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};