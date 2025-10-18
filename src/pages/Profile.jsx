import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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
      const user = auth.currentUser;
      if (!user) return;

      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() });
      } else {
        // Fallback to auth display name
        setProfile({ 
          id: user.uid, 
          username: user.displayName || user.email?.split('@')[0] || 'User' 
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch hosted activities
      const hostedQuery = query(
        collection(db, "activities"),
        where("hostId", "==", user.uid),
        where("endedAt", "==", null)
      );
      const hostedSnapshot = await getDocs(hostedQuery);
      const hosted = hostedSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        badge: "hosted" 
      }));

      // Fetch activity requests
      const requestsQuery = query(
        collection(db, "activityRequests"),
        where("userId", "==", user.uid)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const waiting = [];
      const accepted = [];
      
      for (const requestDoc of requestsSnapshot.docs) {
        const requestData = requestDoc.data();
        const activityDoc = await getDoc(doc(db, "activities", requestData.activityId));
        
        if (activityDoc.exists()) {
          const activityData = { id: activityDoc.id, ...activityDoc.data() };
          if (requestData.status === "pending") {
            waiting.push({ ...activityData, badge: "waiting" });
          } else if (requestData.status === "accepted") {
            accepted.push({ ...activityData, badge: "accepted" });
          }
        }
      }

      setStats({
        hosted: hosted.length,
        waiting: waiting.length,
        accepted: accepted.length,
      });

      setActivities([...hosted, ...waiting, ...accepted]);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
                    imageUrl={activity.imageUrl || undefined}
                    participantCount={0}
                    maxParticipants={activity.maxParticipants}
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
