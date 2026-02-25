import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '@/api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Clock, Flame, Ghost, Sparkles, MoreVertical, BellOff, CheckCircle, Phone, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCall } from '@/context/CallContext';

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
  read?: boolean;
  readAt?: string | null;
}

interface Conversation {
  contact: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
  lastSeen?: string;
}

export const ChatPage: React.FC = () => {
  const { state } = useLocation();
  const socket = useSocket();
  const { user } = useAuth();
  const { startCall } = useCall();
  
  const [activeContact, setActiveContact] = useState<string | null>(state?.contact || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Chat Features State
  const [isMuted, setIsMuted] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<{isOnline: boolean, lastSeen?: string}>({ isOnline: false });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const getExpiryLabel = (createdAt: string) => {
    const expiresAt = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= 0) return "Expired";

    const totalMinutes = Math.floor(remainingMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `Expires in ${hours}h ${minutes}m`;
  };

  // 1. Socket Setup & Presence
  useEffect(() => {
    if (user?.pseudonym && socket) {
      socket.emit("join_chat", user.pseudonym);
      
      socket.on("user_status", (data: { pseudonym: string, isOnline: boolean, lastSeen?: string }) => {
        if (data.pseudonym === activeContact) {
            setOnlineStatus({ isOnline: data.isOnline, lastSeen: data.lastSeen });
        }
      });
    }
    return () => { socket?.off("user_status"); }
  }, [user, socket, activeContact]);

  // 2. Load Sidebar (Conversations)
  const loadSidebar = async () => {
    try {
        const { data: convos } = await API.get('/api/chat/conversations/list');
        
        let finalConvos = convos;

        // ✅ FIX: Prevent Duplicate Conversation for "Message User" button
        if (activeContact) {
            const exists = convos.find((c: any) => c.contact === activeContact);
            if (!exists) {
                // Add a temporary conversation item for the new contact
                const tempConvo = { 
                    contact: activeContact, 
                    lastMessage: 'Start a conversation', 
                    timestamp: new Date().toISOString(), 
                    unreadCount: 0 
                };
                finalConvos = [tempConvo, ...convos];
            }
        }
        
        setConversations(finalConvos);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadSidebar(); }, [activeContact]);

  // 3. Load Chat & Presence
  useEffect(() => {
    if (activeContact) {
      const fetchChatData = async () => {
          try {
            const { data } = await API.get(`/api/chat/${activeContact}`);
            setMessages(data);
            scrollToBottom();
            loadSidebar();
            
            // In a real app, you would fetch the actual online status here
            // For now, we default to false until a socket event updates it
            setOnlineStatus({ isOnline: false }); 
          } catch (error) {
            console.error("Failed to load chat", error);
          }
      };
      fetchChatData();
    }
  }, [activeContact]);

  // 4. Live Messages
  useEffect(() => {
    if (!socket) return;
    socket.on("receive_message", (msg: Message) => {
      // Only append if it belongs to the current open chat
      if (msg.sender === activeContact || msg.recipient === activeContact) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
        // If they messaged, they are online
        setOnlineStatus(prev => ({ ...prev, isOnline: true }));
      }
      // Refresh sidebar to update "Last Message"
      loadSidebar();
    });
    socket.on("message_read", ({ reader, messageIds, readAt }: { reader: string; messageIds: string[]; readAt: string }) => {
      if (!user?.pseudonym) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (
            m.sender === user.pseudonym &&
            m.recipient === reader &&
            messageIds.includes(m._id)
          ) {
            return { ...m, read: true, readAt };
          }
          return m;
        })
      );
    });
    return () => {
      socket.off("receive_message");
      socket.off("message_read");
    };
  }, [socket, activeContact, user?.pseudonym]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeContact) return;
    try {
      await API.post('/api/chat/send', { recipient: activeContact, content: newMessage });
      
      setNewMessage("");
      setShowEmoji(false);
      scrollToBottom();
      loadSidebar();
    } catch (err) { console.error(err); }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="flex h-[calc(100vh-5.25rem)] md:h-[calc(100vh-6rem)] bg-slate-950/80 overflow-hidden rounded-2xl border border-slate-800 m-0 shadow-[0_20px_35px_-25px_rgba(2,6,23,0.8)] professional-panel">
      {/* SIDEBAR */}
      <div className="w-20 md:w-80 border-r border-slate-800 flex flex-col bg-slate-900/90 backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800 font-bold text-lg flex items-center gap-3 text-slate-100 tracking-tight">
            <Ghost className="w-6 h-6 text-blue-600" /> 
            <span className="hidden md:block">Whispers</span>
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-3">
                {conversations.map(c => (
                    <Button
                        key={c.contact}
                        variant={activeContact === c.contact ? "secondary" : "ghost"}
                        className={`w-full justify-start h-auto py-3 px-2 md:px-4 relative group transition-all duration-200 ${activeContact === c.contact ? "bg-slate-800 border border-blue-500/40" : "hover:bg-slate-800/60"}`}
                        onClick={() => setActiveContact(c.contact)}
                    >
                        <Avatar className="h-10 w-10 md:mr-3 border border-slate-700">
                            <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(c.contact)}`} />
                            <AvatarFallback className="bg-slate-800 text-slate-200 font-sans font-bold">{c.contact[0]}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start overflow-hidden w-full">
                            <div className="flex justify-between w-full items-baseline">
                                <span className={`font-semibold text-sm ${activeContact === c.contact ? "text-slate-100" : "text-slate-300"}`}>{c.contact}</span>
                                <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(c.timestamp), { addSuffix: false })}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate w-[90%] opacity-90 mt-1">{c.lastMessage}</p>
                        </div>
                        {c.unreadCount > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </div>
                        )}
                    </Button>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-slate-950/70">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center px-4 md:px-6 justify-between z-10 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9 border border-slate-700">
                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(activeContact)}`} />
                  <AvatarFallback className="bg-slate-800 text-slate-200">{activeContact[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-bold block leading-none text-sm text-slate-100">{activeContact}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineStatus.isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-600'}`}></span>
                        {onlineStatus.isOnline ? 'Online' : onlineStatus.lastSeen ? `Last seen ${formatDistanceToNow(new Date(onlineStatus.lastSeen), { addSuffix: true })}` : 'Last seen recently'}
                    </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => activeContact && startCall(activeContact)}
                    className="hover:bg-emerald-500/10 text-emerald-400 rounded-full"
                    disabled={!activeContact}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <div className="hidden md:flex items-center text-[10px] text-orange-300 font-medium bg-orange-950/50 px-3 py-1 rounded-full border border-orange-700/60">
                    <Flame className="w-3 h-3 mr-1" /> Burn: 24h
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-800 rounded-full text-slate-500"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-300">
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 max-w-3xl mx-auto py-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === user?.pseudonym;
                  const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender !== msg.sender);
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-3'}`}>
                      {!isMe && <div className="w-8">{showAvatar && <Avatar className="w-8 h-8 border border-slate-700"><AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(msg.sender)}`} /><AvatarFallback className="bg-slate-800 text-[10px] text-slate-200">{msg.sender[0]}</AvatarFallback></Avatar>}</div>}
                      <div className={`relative max-w-[85%] md:max-w-[75%] px-4 md:px-5 py-3 text-[15px] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl rounded-tl-sm'}`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end text-[10px] gap-1 mt-1.5 opacity-60`}>
                           {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           <Clock className="w-2.5 h-2.5" />
                        </div>
                        <div className="text-[10px] mt-1 opacity-70 flex items-center gap-1 justify-end">
                          {isMe ? (
                            msg.readAt ? (
                              <>
                                <CheckCheck className="w-3 h-3" />
                                Read {formatDistanceToNowStrict(new Date(msg.readAt), { addSuffix: true })}
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                Sent
                              </>
                            )
                          ) : (
                            getExpiryLabel(msg.createdAt)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl">
              <div className="flex gap-2 md:gap-3 items-end max-w-3xl mx-auto relative">
                <Button variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} className="text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-full">
                    <Sparkles className="w-5 h-5" />
                </Button>
                {showEmoji && <div className="absolute bottom-16 left-0 z-50"><EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} width={300} height={400}  /></div>}
                
                <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                    placeholder="Whisper something..." 
                    className="flex-1 bg-slate-950 border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-500 min-h-[46px] rounded-xl text-base px-4 text-slate-100" 
                />
                
                <Button onClick={sendMessage} size="icon" className="h-[48px] w-[48px] rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:scale-105 transition-all">
                    <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-pulse border border-slate-700">
                <Ghost className="w-10 h-10 opacity-40" />
            </div>
            <h3 className="font-bold text-2xl text-slate-100 mb-2 tracking-tight">Shadow Messages</h3>
            <p className="max-w-xs text-sm opacity-60 leading-relaxed">
                Select a conversation or start a new whisper. All messages are encrypted, anonymous, and burn after 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
