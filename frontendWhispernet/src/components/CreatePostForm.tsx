import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Mic, X, Loader2, Smile, BarChart3, Plus, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

interface CreatePostFormProps {
  onSubmit: (post: any) => void;
  isSubmitting?: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSubmit, isSubmitting }) => {
  const DRAFT_KEY = "whispernet_post_draft";
  const MAX_CHARS = 1200;
  const quickTemplates = ["Hot take:", "Campus update:", "Need help with:", "Unpopular opinion:"];
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video' | 'none'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  React.useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setContent(draft);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(DRAFT_KEY, content);
  }, [content]);

  const handleFilePicked = (file: File) => {
    setMediaFile(file);
    if (file.type.startsWith("audio")) setMediaType("audio");
    else if (file.type.startsWith("video")) setMediaType("video");
    else setMediaType("image");
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilePicked(e.target.files[0]);
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

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  };

  const handleSubmit = async () => {
    const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    const hasPoll = showPoll && pollQuestion.trim() && validPollOptions.length >= 2;
    if (!content.trim() && !mediaFile && !hasPoll) return;
    if (content.length > MAX_CHARS) return;
    
    // We pass the data up to the parent HomePage to handle the API call logic if preferred,
    // or handle it here. Assuming parent handles the API post-processing or we do it here.
    // For consistency with your earlier code, let's assume we prepare the FormData here.
    
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFile) formData.append('file', mediaFile);
    if (hasPoll) {
      formData.append(
        "poll",
        JSON.stringify({
          question: pollQuestion.trim(),
          options: validPollOptions,
        })
      );
    }
    
    onSubmit(formData); 
    
    // Reset form
    setContent('');
    clearMedia();
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPoll(false);
    setShowEmoji(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  const canPostPoll = showPoll && pollQuestion.trim().length > 0 && validPollOptions.length >= 2;
  const charsLeft = MAX_CHARS - content.length;
  const canSubmit = (!!content.trim() || !!mediaFile || canPostPoll) && charsLeft >= 0;

  return (
    <div
      className={`mb-8 professional-panel p-5 relative z-20 bg-slate-900/75 border-slate-700 transition-colors ${dragOver ? "ring-2 ring-blue-500/60 border-blue-500/60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFilePicked(file);
      }}
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setContent((prev) => (prev ? `${prev}\n${template} ` : `${template} `))}
                className="text-xs rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300 hover:border-blue-500/40"
              >
                {template}
              </button>
            ))}
          </div>
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (canSubmit && !isSubmitting) handleSubmit();
              }
            }}
            placeholder="What's your secret?" 
            className="min-h-[110px] border-none bg-transparent resize-none focus-visible:ring-0 p-0 text-lg placeholder:text-slate-500 text-slate-100"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tip: Press Cmd/Ctrl + Enter to post</span>
            <span className={charsLeft < 80 ? "text-amber-400" : "text-slate-500"}>{charsLeft} chars left</span>
          </div>
          
          {mediaPreview && (
            <div className="relative mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 inline-block">
              <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-full z-10" onClick={clearMedia}>
                <X className="h-3 w-3" />
              </Button>
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="h-40 w-auto object-cover" />
              ) : mediaType === 'video' ? (
                <video controls autoPlay muted loop playsInline preload="metadata" src={mediaPreview} className="h-40 w-auto object-cover rounded-xl" />
              ) : (
                <audio controls src={mediaPreview} className="min-w-[200px]" />
              )}
            </div>
          )}

          {showPoll && (
            <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-900/70 space-y-3">
              <Textarea
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question..."
                className="min-h-[70px] bg-slate-950 border-slate-700 text-slate-100"
              />
              {pollOptions.map((option, idx) => (
                <input
                  key={idx}
                  value={option}
                  onChange={(e) => updatePollOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-slate-700 pt-3">
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
                            className="absolute top-10 left-0 z-50 shadow-xl rounded-xl border border-slate-700 bg-slate-900"
                        >
                            <EmojiPicker onEmojiClick={(e) => setContent(prev => prev + e.emoji)} width={300} height={350} searchDisabled />
                        </motion.div>
                    )}
                </AnimatePresence>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Video className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'} transition-colors`}
              >
                <Mic className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPoll((prev) => !prev)}
                className={`${showPoll ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'} transition-colors`}
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </div>
            
            <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit} className="px-6 rounded-full font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Whisper"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
