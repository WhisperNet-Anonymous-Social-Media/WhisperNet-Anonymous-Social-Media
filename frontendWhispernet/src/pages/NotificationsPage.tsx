import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { mockNotifications, Notification } from '@/lib/dummyData';
import { Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const Icon = notification.type === 'like' ? Heart : MessageCircle;
  const iconColor = notification.type === 'like' ? 'text-pink-500' : 'text-blue-500';
  const text = notification.type === 'like' 
    ? 'liked your whisper' 
    : 'commented on your whisper';

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer relative">
      <div className="relative">
        <Avatar className="w-12 h-12 border">
          <AvatarImage src={notification.user.avatar} />
          <AvatarFallback>{notification.user.anonymousId.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 rounded-full p-1 bg-background`}>
          <Icon className={cn("w-5 h-5", iconColor, notification.type === 'like' && 'fill-current')} />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-foreground">
          <span className="font-semibold">{notification.user.anonymousId}</span> {text}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-1 italic">
          "{notification.postContent}"
        </p>
        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.timestamp)}</p>
      </div>
      {!notification.read && (
        <div className="w-2.5 h-2.5 bg-primary rounded-full absolute top-4 right-4"></div>
      )}
    </div>
  );
};

export const NotificationsPage: React.FC = () => {
  const [notifications] = React.useState<Notification[]>(mockNotifications);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Recent activity on your whispers.</p>
        </div>
        <Card>
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground p-12">
                You have no new notifications.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};