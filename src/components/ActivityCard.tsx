import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface ActivityCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  participantCount: number;
  maxParticipants: number;
  badge?: "hosted" | "waiting" | "accepted";
}

export const ActivityCard = ({
  id,
  title,
  imageUrl,
  participantCount,
  maxParticipants,
  badge,
}: ActivityCardProps) => {
  const getBadgeColor = () => {
    switch (badge) {
      case "hosted":
        return "bg-accent text-accent-foreground";
      case "waiting":
        return "bg-secondary text-secondary-foreground";
      case "accepted":
        return "bg-primary text-primary-foreground";
      default:
        return "";
    }
  };

  return (
    <Link to={`/activity/${id}`}>
      <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer relative">
        {badge && (
          <Badge className={`absolute top-2 right-2 z-10 ${getBadgeColor()}`}>
            {badge}
          </Badge>
        )}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Users className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2 truncate">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {participantCount}/{maxParticipants}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
