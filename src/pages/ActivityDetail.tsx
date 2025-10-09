import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Users, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  host_id: string;
  max_participants: number;
  profiles: {
    username: string;
  };
}

interface JoinRequest {
  id: string;
  status: string;
  profiles: {
    username: string;
  };
}

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [userRequestStatus, setUserRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestsDialog, setShowRequestsDialog] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch activity
      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("*, profiles(username)")
        .eq("id", id)
        .single();

      if (activityError) throw activityError;
      setActivity(activityData);
      setIsHost(activityData.host_id === user.id);

      // If host, fetch all requests
      if (activityData.host_id === user.id) {
        const { data: requestsData } = await supabase
          .from("activity_requests")
          .select("*, profiles(username)")
          .eq("activity_id", id);
        setRequests(requestsData || []);
      } else {
        // Check user's request status
        const { data: userRequest } = await supabase
          .from("activity_requests")
          .select("status")
          .eq("activity_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        setUserRequestStatus(userRequest?.status || null);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load activity.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("activity_requests").insert({
        activity_id: id,
        user_id: user.id,
        status: "waiting",
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Waiting for host approval.",
      });

      setUserRequestStatus("waiting");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send request.",
      });
    }
  };

  const handleRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("activity_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: action === "accepted" ? "Request accepted" : "Request rejected",
      });

      fetchActivity();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update request.",
      });
    }
  };

  const handleEndActivity = async () => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Activity ended",
        description: "The activity has been ended successfully.",
      });

      navigate("/profile");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end activity.",
      });
    }
  };

  if (loading || !activity) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "waiting");

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="aspect-video bg-muted">
              {activity.image_url ? (
                <img
                  src={activity.image_url}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{activity.title}</h1>
              <p className="text-sm text-muted-foreground">
                Hosted by {activity.profiles.username}
              </p>
            </div>

            {activity.description && (
              <p className="text-foreground">{activity.description}</p>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>Max {activity.max_participants} participants</span>
            </div>

            {isHost ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRequestsDialog(true)}
                >
                  View Requests ({pendingRequests.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/activity/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Activity
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleEndActivity}
                >
                  End Activity
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {!userRequestStatus && (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleJoinRequest}
                  >
                    Request to Join
                  </Button>
                )}
                {userRequestStatus === "waiting" && (
                  <div className="text-center p-4 bg-secondary rounded-lg text-secondary-foreground">
                    Request pending...
                  </div>
                )}
                {userRequestStatus === "accepted" && (
                  <div className="text-center p-4 bg-primary rounded-lg text-primary-foreground">
                    You're in! You can join the group chat.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showRequestsDialog} onOpenChange={setShowRequestsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Requests</DialogTitle>
            <DialogDescription>
              Review and manage requests to join your activity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No pending requests
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {request.profiles.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{request.profiles.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRequestAction(request.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => handleRequestAction(request.id, "accepted")}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
