import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Mic, X, Loader2, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '@/api';
import EmojiPicker from 'emoji-picker-react';

interface CreatePostFormProps {
  onSubmit: (post: any) => void;
  isSubmitting?: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSubmit, isSubmitting }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'none'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaType('image');
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], "voice_note.webm", { type: 'audio/webm' });
        setMediaFile(file);
        setMediaType('audio');
        setMediaPreview(URL.createObjectURL(blob));
      };
      
      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Mic access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaType('none');
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;
    
    // We pass the data up to the parent HomePage to handle the API call logic if preferred,
    // or handle it here. Assuming parent handles the API post-processing or we do it here.
    // For consistency with your earlier code, let's assume we prepare the FormData here.
    
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFile) formData.append('file', mediaFile);
    
    onSubmit(formData); 
    
    // Reset form
    setContent('');
    clearMedia();
    setShowEmoji(false);
  };

  return (
    <div className="mb-8 glass-card rounded-xl p-4 shadow-sm relative z-20">
      <div className="flex gap-4">
        <div className="flex-1">
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's your secret?" 
            className="min-h-[100px] border-none bg-transparent resize-none focus-visible:ring-0 p-0 text-lg placeholder:text-muted-foreground/50"
          />
          
          {mediaPreview && (
            <div className="relative mt-4 rounded-lg overflow-hidden bg-muted/20 border border-border/50 inline-block">
              <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full z-10" onClick={clearMedia}>
                <X className="h-3 w-3" />
              </Button>
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="h-40 w-auto object-cover" />
              ) : (
                <audio controls src={mediaPreview} className="min-w-[200px]" />
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-border/40 pt-3">
            <div className="flex gap-2 items-center relative">
               {/* Emoji Button */}
                <Button 
                    variant="ghost" size="icon" 
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => setShowEmoji(!showEmoji)}
                >
                    <Smile className="w-5 h-5" />
                </Button>
                
                <AnimatePresence>
                    {showEmoji && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute top-10 left-0 z-50 shadow-xl rounded-xl border bg-background"
                        >
                            <EmojiPicker onEmojiClick={(e) => setContent(prev => prev + e.emoji)} width={300} height={350} searchDisabled />
                        </motion.div>
                    )}
                </AnimatePresence>

              <div className="h-4 w-px bg-border/60 mx-1"></div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'} transition-colors`}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
            
            <Button onClick={handleSubmit} disabled={isSubmitting || (!content && !mediaFile)} className="px-6 rounded-full font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Whisper"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};