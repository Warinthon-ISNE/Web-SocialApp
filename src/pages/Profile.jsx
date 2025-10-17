import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityCard } from "@/components/ActivityCard";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ hosted: 0, waiting: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: hostedData } = await supabase
        .from("activities")
        .select("*")
        .eq("host_id", user.id)
        .is("ended_at", null);

      const { data: requestsData } = await supabase
        .from("activity_requests")
        .select("*, activities(*)")
        .eq("user_id", user.id);

      const hosted = hostedData || [];
      const waiting = requestsData?.filter(r => r.status === "pending") || [];
      const accepted = requestsData?.filter(r => r.status === "accepted") || [];

      setStats({
        hosted: hosted.length,
        waiting: waiting.length,
        accepted: accepted.length,
      });

      const allActivities = [
        ...hosted.map(a => ({ ...a, badge: "hosted" })),
        ...waiting.map(r => ({ ...r.activities, badge: "waiting" })),
        ...accepted.map(r => ({ ...r.activities, badge: "accepted" })),
      ];

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/auth");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {profile && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    {profile.username}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-accent">{stats.hosted}</div>
                    <div className="text-sm text-muted-foreground">Hosted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">{stats.waiting}</div>
                    <div className="text-sm text-muted-foreground">Waiting</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.accepted}</div>
                    <div className="text-sm text-muted-foreground">Accepted</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">My Activities</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activities...
              </div>
            ) : activities.length === 0 ? (
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
                    badge={activity.badge}
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
