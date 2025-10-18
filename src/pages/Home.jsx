import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ActivityCard } from "@/components/ActivityCard";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const activitiesRef = collection(db, "activities");
      const q = query(
        activitiesRef,
        where("endedAt", "==", null),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Home</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading activities...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  id={activity.id}
                  title={activity.title}
                  imageUrl={activity.imageUrl || undefined}
                  participantCount={0}
                  maxParticipants={activity.maxParticipants}
                />
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
