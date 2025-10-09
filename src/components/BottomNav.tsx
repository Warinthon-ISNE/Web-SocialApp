import { Home, Plus, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-16 transition-colors",
            isActive("/") ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Home className="h-6 w-6" />
        </Link>
        <Link
          to="/create"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-16 transition-colors",
            isActive("/create") ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Plus className="h-6 w-6" />
        </Link>
        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-16 transition-colors",
            isActive("/profile") ? "text-primary" : "text-muted-foreground"
          )}
        >
          <User className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
};
