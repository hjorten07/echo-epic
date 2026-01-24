import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, Loader2, Music, UserPlus, Award, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from "@/hooks/useNotifications";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Fetch profiles for follow notifications
  const { data: profiles } = useQuery({
    queryKey: ["notification-profiles", notifications?.map(n => n.related_item_id).filter(Boolean)],
    queryFn: async () => {
      const userIds = notifications
        ?.filter(n => n.type?.includes("follow") && n.related_item_id)
        .map(n => n.related_item_id) || [];
      
      if (userIds.length === 0) return {};
      
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      
      return Object.fromEntries(data?.map(p => [p.id, p]) || []);
    },
    enabled: !!notifications && notifications.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Bell className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Sign in to view notifications</h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }

    // Navigate based on notification type
    if (notification.type?.includes("follow") && notification.related_item_id) {
      navigate(`/user/${notification.related_item_id}`);
    } else if (notification.related_item_type && notification.related_item_id) {
      navigate(`/${notification.related_item_type}/${notification.related_item_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type?.includes("follow")) return <UserPlus className="w-5 h-5" />;
    if (type?.includes("badge")) return <Award className="w-5 h-5" />;
    if (type?.includes("message")) return <MessageCircle className="w-5 h-5" />;
    return <Music className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            {notifications && notifications.some(n => !n.read) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="font-display text-xl font-semibold mb-2">No notifications</h2>
              <p className="text-muted-foreground">
                You'll see notifications here when something happens
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const profile = notification.related_item_id 
                  ? profiles?.[notification.related_item_id] 
                  : null;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-colors",
                      notification.read 
                        ? "bg-secondary/30 hover:bg-secondary/50" 
                        : "bg-primary/10 hover:bg-primary/15 border border-primary/20"
                    )}
                  >
                    {/* Avatar or Icon */}
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : profile?.username ? (
                        <span className="font-bold text-lg">{profile.username[0]?.toUpperCase()}</span>
                      ) : (
                        <div className="text-primary">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium",
                        !notification.read && "text-foreground"
                      )}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
