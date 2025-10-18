import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Users, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

export default function Chat() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [activityTitle, setActivityTitle] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchActivityDetails();
    fetchUserProfile();
    const unsubscribe = subscribeToMessages();
    const unsubscribeParticipants = subscribeToParticipants();
    return () => {
      unsubscribe && unsubscribe();
      unsubscribeParticipants && unsubscribeParticipants();
    };
  }, [activityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchActivityDetails = async () => {
    try {
      const activityDoc = await getDoc(doc(db, "activities", activityId));
      if (activityDoc.exists()) {
        setActivityTitle(activityDoc.data().title || "Group Chat");
      }
    } catch (error) {
      console.error("Error fetching activity details:", error);
    }
  };

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setUsername(profileData.username || user.displayName || "User");
        setProfileImage(profileData.profileImage || "");
      } else {
        setUsername(user.displayName || user.email?.split("@")[0] || "User");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUsername(user.displayName || user.email?.split("@")[0] || "User");
    }
  };

  const subscribeToParticipants = () => {
    try {
      const chatDoc = doc(db, "chats", activityId);
      const unsubscribe = onSnapshot(chatDoc, async (snapshot) => {
        if (snapshot.exists()) {
          const chatData = snapshot.data();
          const participantIds = chatData.participants || [];
          setParticipantCount(participantIds.length);

          // Fetch profile data for each participant
          const participantsData = [];
          for (const userId of participantIds) {
            try {
              const profileDoc = await getDoc(doc(db, "profiles", userId));
              if (profileDoc.exists()) {
                const profileData = profileDoc.data();
                participantsData.push({
                  id: userId,
                  username: profileData.username || "User",
                  name: profileData.name || profileData.username || "User",
                  profileImage: profileData.profileImage || "",
                });
              } else {
                participantsData.push({
                  id: userId,
                  username: "User",
                  name: "User",
                  profileImage: "",
                });
              }
            } catch (error) {
              console.error("Error fetching participant profile:", error);
              participantsData.push({
                id: userId,
                username: "User",
                name: "User",
                profileImage: "",
              });
            }
          }
          setParticipants(participantsData);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error subscribing to participants:", error);
      return null;
    }
  };

  const subscribeToMessages = () => {
    try {
      const messagesRef = collection(db, "chats", activityId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesData);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error subscribing to messages:", error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const messagesRef = collection(db, "chats", activityId, "messages");
      await addDoc(messagesRef, {
        userId: user.uid,
        username: username,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              
              <div className="flex items-center gap-3 flex-1">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <h1 className="font-semibold text-gray-900">{activityTitle}</h1>
                  <button
                    onClick={() => setShowParticipants(true)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {participantCount} member{participantCount !== 1 ? "s" : ""}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4 min-h-[calc(100vh-200px)]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-gray-500 text-center">
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.userId === auth.currentUser?.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} gap-3`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={msg.profileImage} alt={msg.username} />
                        <AvatarFallback className="text-xs">
                          {getInitials(msg.username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[70%] ${isCurrentUser ? "order-first" : ""}`}>
                      {!isCurrentUser && (
                        <p className="text-xs font-medium text-gray-700 mb-1 px-1">
                          {msg.username}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 px-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>

                    {isCurrentUser && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={profileImage} alt={username} />
                        <AvatarFallback className="text-xs">
                          {getInitials(username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                placeholder="Type a new message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
                maxLength={500}
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full"
              />
              <Button 
                type="submit" 
                disabled={loading || !newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Participants Modal */}
        <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Members ({participantCount})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profileImage} alt={participant.name} />
                    <AvatarFallback>
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{participant.name}</p>
                    <p className="text-sm text-gray-600">@{participant.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
