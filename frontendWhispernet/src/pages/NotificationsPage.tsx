import React, { useEffect, useState } from 'react';
import API from '@/api';
import { Card } from '@/components/ui/card';
import { Bell, Heart, MessageCircle, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Notification {
  _id: string;
  sender: string;
  type: 'like' | 'comment' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return (
    <div className="container max-w-2xl py-8 px-4 space-y-4">
       <Skeleton className="h-8 w-48 mb-6" />
       {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center tracking-tight">
            <Bell className="mr-3 h-6 w-6 text-primary" />
            Notifications
            {notifications.some(n => !n.read) && (
              <Badge className="ml-3 bg-primary hover:bg-primary/90">
                {notifications.filter(n => !n.read).length} New
              </Badge>
            )}
          </h2>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-muted-foreground hover:text-primary">
              <Check className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">When someone interacts with you, it will show up here.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Card 
                key={notif._id} 
                className={`p-4 flex items-start space-x-4 transition-all hover:shadow-md border-l-4 ${notif.read ? 'border-l-transparent bg-slate-900/70 border border-slate-800' : 'border-l-primary bg-slate-900 border border-slate-700 shadow-sm'}`}
              >
                <div className={`p-2 rounded-full ${notif.type === 'like' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {notif.type === 'like' ? <Heart className="w-5 h-5 fill-current" /> : <MessageCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-foreground">{notif.sender}</span> {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
