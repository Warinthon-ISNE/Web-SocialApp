import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Users, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activity, setActivity] = useState(null);
  const [requests, setRequests] = useState([]);
  const [userRequest, setUserRequest] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const activityDoc = await getDoc(doc(db, "activities", id));

      if (!activityDoc.exists()) {
        throw new Error("Activity not found");
      }

      const activityData = { id: activityDoc.id, ...activityDoc.data() };
      setActivity(activityData);
      setIsHost(activityData.hostId === user.uid);

      if (activityData.hostId === user.uid) {
        // Fetch requests for this activity
        const requestsQuery = query(
          collection(db, "activityRequests"),
          where("activityId", "==", id)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requestsData = [];
        for (const requestDoc of requestsSnapshot.docs) {
          const requestData = { id: requestDoc.id, ...requestDoc.data() };
          
          // Fetch profile for each request
          const profileDoc = await getDoc(doc(db, "profiles", requestData.userId));
          if (profileDoc.exists()) {
            requestData.profiles = { id: profileDoc.id, ...profileDoc.data() };
          }
          requestsData.push(requestData);
        }

        // Sort by created date (newest first)
        requestsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(requestsData);
      } else {
        // Fetch user's request for this activity
        const userRequestQuery = query(
          collection(db, "activityRequests"),
          where("activityId", "==", id),
          where("userId", "==", user.uid)
        );
        const userRequestSnapshot = await getDocs(userRequestQuery);
        
        if (!userRequestSnapshot.empty) {
          const requestDoc = userRequestSnapshot.docs[0];
          setUserRequest({ id: requestDoc.id, ...requestDoc.data() });
        }
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load activity details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "activityRequests"), {
        activityId: id,
        userId: user.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Request sent!",
        description: "Waiting for host approval.",
      });

      fetchActivity();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send request.",
      });
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await updateDoc(doc(db, "activityRequests", requestId), {
        status: action,
      });

      toast({
        title: action === "accepted" ? "Request accepted" : "Request declined",
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
      await updateDoc(doc(db, "activities", id), {
        endedAt: new Date().toISOString(),
      });

      toast({
        title: "Activity ended",
        description: "This activity has been marked as ended.",
      });

      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end activity.",
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!activity) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Activity not found</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="max-w-lg mx-auto">
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-4 border-b border-border">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {activity.imageUrl && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{activity.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Max {activity.maxParticipants} participants
                </span>
              </div>
            </div>

            {activity.description && (
              <>
                <Separator />
                <p className="text-foreground">{activity.description}</p>
              </>
            )}

            {isHost ? (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-2" />
                        End Activity
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End this activity?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently end the activity and remove it from the app.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEndActivity}>
                          End Activity
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {requests.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        Join Requests ({requests.length})
                      </h2>
                      {requests.map((request) => (
                        <Card key={request.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {request.profiles?.username}
                              </p>
                              <Badge
                                variant={
                                  request.status === "accepted"
                                    ? "default"
                                    : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {request.status}
                              </Badge>
                            </div>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleRequestAction(request.id, "accepted")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestAction(request.id, "rejected")}
                                >
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <Separator />
                {userRequest ? (
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <p className="text-foreground">Your request status:</p>
                      <Badge
                        variant={
                          userRequest.status === "accepted"
                            ? "default"
                            : userRequest.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {userRequest.status}
                      </Badge>
                    </div>
                  </Card>
                ) : (
                  <Button onClick={handleJoinRequest} className="w-full">
                    Request to Join
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
