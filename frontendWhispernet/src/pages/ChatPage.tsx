import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '@/api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Clock, Flame, Ghost, Sparkles, MoreVertical, BellOff, CheckCircle } from 'lucide-react';
import { differenceInHours, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  contact: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean; // ✅ Added
  lastSeen?: string;  // ✅ Added
}

export const ChatPage: React.FC = () => {
  const { state } = useLocation();
  const socket = useSocket();
  const { user } = useAuth();
  
  const [activeContact, setActiveContact] = useState<string | null>(state?.contact || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  
  // ✅ Chat Features State
  const [isMuted, setIsMuted] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<{isOnline: boolean, lastSeen?: string}>({ isOnline: false });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Socket Setup & Presence
  useEffect(() => {
    if (user?.pseudonym && socket) {
      socket.emit("join_chat", user.pseudonym);
      
      // ✅ Listen for status updates
      socket.on("user_status", (data: { pseudonym: string, isOnline: boolean, lastSeen?: string }) => {
        if (data.pseudonym === activeContact) {
            setOnlineStatus({ isOnline: data.isOnline, lastSeen: data.lastSeen });
        }
      });
    }
    return () => { socket?.off("user_status"); }
  }, [user, socket, activeContact]);

  // 2. Load Sidebar
  const loadSidebar = async () => {
    try {
        const { data: convos } = await API.get('/api/chat/conversations/list');
        setConversations(convos);
        if (convos.length === 0) {
            const { data: suggs } = await API.get('/api/chat/suggestions');
            setSuggestions(suggs);
        }
        if (activeContact && !convos.find((c: any) => c.contact === activeContact)) {
             setConversations(prev => [{ contact: activeContact, lastMessage: 'Start a conversation', timestamp: new Date().toISOString(), unreadCount: 0 }, ...prev]);
        }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadSidebar(); }, [activeContact]);

  // 3. Load Chat & Presence
  useEffect(() => {
    if (activeContact) {
      const fetchChatData = async () => {
          const { data } = await API.get(`/api/chat/${activeContact}`);
          setMessages(data);
          scrollToBottom();
          
          // ✅ Mock Fetch Presence (In real app, you'd fetch this from API)
          // For now, assume online if they sent a message recently
          setOnlineStatus({ isOnline: Math.random() > 0.5 }); // Simulate for demo if API not ready
      };
      fetchChatData();
    }
  }, [activeContact]);

  // 4. Live Messages
  useEffect(() => {
    if (!socket) return;
    socket.on("receive_message", (msg: Message) => {
      if (msg.sender === activeContact || msg.recipient === activeContact) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
        // If they messaged, they are online
        setOnlineStatus(prev => ({ ...prev, isOnline: true }));
      }
      loadSidebar();
    });
    return () => { socket.off("receive_message"); };
  }, [socket, activeContact]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeContact) return;
    try {
      await API.post('/api/chat/send', { recipient: activeContact, content: newMessage });
      setNewMessage("");
      setShowEmoji(false);
    } catch (err) { console.error(err); }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const getBurnTime = (createdAt: string) => {
    const hoursLeft = 24 - differenceInHours(new Date(), new Date(createdAt));
    return hoursLeft <= 0 ? "Expired" : `${hoursLeft}h`;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden rounded-xl border border-border/40 m-4 shadow-sm glass-card">
      {/* SIDEBAR */}
      <div className="w-20 md:w-80 border-r border-border/40 flex flex-col bg-muted/10">
        <div className="p-4 border-b border-border/40 font-bold text-lg flex items-center gap-2 text-primary tracking-tight">
            <Ghost className="w-5 h-5" /> <span className="hidden md:block">Whispers</span>
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
                {conversations.map(c => (
                    <Button
                        key={c.contact}
                        variant={activeContact === c.contact ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto py-3 px-2 md:px-4 relative group hover:bg-muted/20"
                        onClick={() => setActiveContact(c.contact)}
                    >
                        <Avatar className="h-10 w-10 md:mr-3 border border-border/50">
                            <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-sans">{c.contact[0]}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start overflow-hidden w-full">
                            <div className="flex justify-between w-full">
                                <span className="font-semibold text-sm">{c.contact}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.timestamp), { addSuffix: false })}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate w-[90%] opacity-80">{c.lastMessage}</p>
                        </div>
                        {c.unreadCount > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />}
                    </Button>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-background/50">
        {activeContact ? (
          <>
            <div className="h-16 border-b border-border/40 flex items-center px-6 justify-between z-10 bg-background/80 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9 border border-border"><AvatarFallback>{activeContact[0]}</AvatarFallback></Avatar>
                <div>
                    <span className="font-bold block leading-none text-sm">{activeContact}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineStatus.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                        {onlineStatus.isOnline ? 'Online' : 'Last seen recently'}
                    </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center text-[10px] text-orange-600 font-medium bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <Flame className="w-3 h-3 mr-1" /> Burn: 24h
                  </div>
                  
                  {/* ✅ DM Features Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsMuted(!isMuted)}>
                            <BellOff className="w-4 h-4 mr-2" /> {isMuted ? 'Unmute' : 'Mute Notifications'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Unread
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 max-w-3xl mx-auto py-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === user?.pseudonym;
                  const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender !== msg.sender);
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                      {!isMe && <div className="w-6">{showAvatar && <Avatar className="w-6 h-6"><AvatarFallback className="text-[9px]">{msg.sender[0]}</AvatarFallback></Avatar>}</div>}
                      <div className={`relative max-w-[75%] px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' : 'bg-card border border-border/50 rounded-2xl rounded-tl-sm'}`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center justify-end text-[10px] gap-1.5 mt-1 opacity-70`}>
                           {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           <Clock className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
              <div className="flex gap-2 items-end max-w-3xl mx-auto relative">
                <Button variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} className="text-muted-foreground hover:text-primary">
                    <Sparkles className="w-5 h-5" />
                </Button>
                {showEmoji && <div className="absolute bottom-14 left-0 z-50"><EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} width={300} height={400} /></div>}
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Whisper something..." className="flex-1 bg-muted/40 border-none focus-visible:ring-1 min-h-[45px]" />
                <Button onClick={sendMessage} size="icon" className="h-[45px] w-[45px] rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"><Send className="w-5 h-5" /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 animate-pulse"><Ghost className="w-8 h-8 opacity-50" /></div>
            <h3 className="font-bold text-xl text-foreground mb-2">Shadow Messages</h3>
            <p className="max-w-xs text-sm opacity-70">Encrypted. Anonymous. Ephemeral.</p>
          </div>
        )}
      </div>
    </div>
  );
};