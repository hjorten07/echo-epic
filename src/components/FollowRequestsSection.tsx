import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  requester_id: string;
  created_at: string;
  requester?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const FollowRequestsSection = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("follow_requests")
        .select(`
          id,
          requester_id,
          created_at
        `)
        .eq("target_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching follow requests:", error);
        setLoading(false);
        return;
      }

      // Fetch requester profiles
      const requesterIds = data?.map((r) => r.requester_id) || [];
      if (requesterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", requesterIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]));
        const enrichedRequests = data?.map((r) => ({
          ...r,
          requester: profileMap.get(r.requester_id),
        })) || [];
        
        setRequests(enrichedRequests);
      } else {
        setRequests([]);
      }
      
      setLoading(false);
    };

    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("follow-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_requests",
          filter: `target_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleAccept = async (request: FollowRequest) => {
    if (!user) return;
    setProcessing(request.id);

    try {
      // Create the follow relationship
      await supabase.from("follows").insert({
        follower_id: request.requester_id,
        following_id: user.id,
      });

      // Update the request status
      await supabase
        .from("follow_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      // Create notification for the requester
      await supabase.from("notifications").insert({
        user_id: request.requester_id,
        type: "follow_accepted",
        title: "Follow Request Accepted",
        message: `Your follow request was accepted!`,
        related_item_type: "user",
        related_item_id: user.id,
      });

      toast.success(`Accepted follow request from ${request.requester?.username}`);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }

    setProcessing(null);
  };

  const handleReject = async (request: FollowRequest) => {
    setProcessing(request.id);

    try {
      await supabase
        .from("follow_requests")
        .delete()
        .eq("id", request.id);

      toast.success("Request declined");
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to decline request");
    }

    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Follow Requests ({requests.length})
      </h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
          >
            <Link
              to={`/user/${request.requester_id}`}
              className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/30"
            >
              {request.requester?.avatar_url ? (
                <img
                  src={request.requester.avatar_url}
                  alt={request.requester.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                  {request.requester?.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </Link>
            <Link
              to={`/user/${request.requester_id}`}
              className="flex-1 font-medium hover:text-primary transition-colors"
            >
              {request.requester?.username || "Unknown"}
            </Link>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleReject(request)}
                disabled={processing === request.id}
              >
                {processing === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(request)}
                disabled={processing === request.id}
              >
                {processing === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
