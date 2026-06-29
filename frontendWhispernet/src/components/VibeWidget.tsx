import React, { useEffect, useState } from 'react';
import API from '@/api';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VibeData {
  mood: string;
  emoji: string;
  confidence: number;
}

interface VibeWidgetProps {
  onVibeChange?: (mood: string) => void;
}

export const VibeWidget: React.FC<VibeWidgetProps> = ({ onVibeChange }) => {
  const [vibe, setVibe] = useState<VibeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVibe = async () => {
      try {
        const { data } = await API.get('/api/vibe/current');
        setVibe(data);
        if (data && onVibeChange) {
          onVibeChange(data.mood);
        }
      } catch (err) {
        console.error("Failed to fetch vibe", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVibe();
    // Refresh vibe every 5 minutes
    const interval = setInterval(fetchVibe, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [onVibeChange]);

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!vibe) return null;

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="hidden md:flex items-center space-x-2"
      >
        <Badge 
          variant="outline" 
          className="px-3 py-1 bg-background/50 backdrop-blur-sm border-primary/20 shadow-sm transition-all duration-300"
        >
          <span className="mr-2 text-lg">{vibe.emoji}</span>
          <span className="font-medium text-foreground/80">
            Current Vibe: <span className="font-bold text-primary">{vibe.mood}</span>
          </span>
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
};