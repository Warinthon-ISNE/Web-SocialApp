import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return children;
};
