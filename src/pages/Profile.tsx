import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "@/components/ActivityCard";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { User as UserIcon } from "lucide-react";

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface ActivityWithStatus {
  id: string;
  title: string;
  image_url: string | null;
  max_participants: number;
  status: "hosted" | "waiting" | "accepted";
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [stats, setStats] = useState({ hosted: 0, waiting: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch hosted activities
      const { data: hostedActivities } = await supabase
        .from("activities")
        .select("*")
        .eq("host_id", user.id)
        .is("ended_at", null);

      // Fetch activity requests
      const { data: requests } = await supabase
        .from("activity_requests")
        .select("*, activities(*)")
        .eq("user_id", user.id);

      const activitiesWithStatus: ActivityWithStatus[] = [];
      
      // Add hosted activities
      if (hostedActivities) {
        activitiesWithStatus.push(
          ...hostedActivities.map((activity) => ({
            id: activity.id,
            title: activity.title,
            image_url: activity.image_url,
            max_participants: activity.max_participants,
            status: "hosted" as const,
          }))
        );
      }

      // Add requested activities
      if (requests) {
        requests.forEach((request: any) => {
          if (request.activities) {
            activitiesWithStatus.push({
              id: request.activities.id,
              title: request.activities.title,
              image_url: request.activities.image_url,
              max_participants: request.activities.max_participants,
              status: request.status === "waiting" ? "waiting" : "accepted",
            });
          }
        });
      }

      setActivities(activitiesWithStatus);

      // Calculate stats
      const hostedCount = hostedActivities?.length || 0;
      const waitingCount = requests?.filter((r) => r.status === "waiting").length || 0;
      const acceptedCount = requests?.filter((r) => r.status === "accepted").length || 0;

      setStats({
        hosted: hostedCount,
        waiting: waitingCount,
        accepted: acceptedCount,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{profile?.username}</h2>
            
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.hosted}</div>
                <div className="text-sm text-muted-foreground">Hosted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.waiting}</div>
                <div className="text-sm text-muted-foreground">Waiting</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.accepted}</div>
                <div className="text-sm text-muted-foreground">Accepted</div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full max-w-xs"
            >
              Logout
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">My Activities</h3>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities yet
              </div>
            ) : (
              <div className="grid gap-4">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    id={activity.id}
                    title={activity.title}
                    imageUrl={activity.image_url || undefined}
                    participantCount={0}
                    maxParticipants={activity.max_participants}
                    badge={activity.status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
