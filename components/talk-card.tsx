import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TalkCardProps = {
  talk: {
    id: string;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    level: "beginner" | "intermediate" | "advanced";
    format: "talk" | "workshop" | "keynote" | "panel";
    speaker: {
      id: string;
      name: string;
      avatar: string;
      company: string;
    };
    track: {
      id: string;
      name: string;
      color: string;
    };
    room: {
      id: string;
      name: string;
    };
  };
  showTime?: boolean;
};

const levelColors = {
  beginner: "bg-green-500/10 text-green-700 dark:text-green-400",
  intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  advanced: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const formatIcons = {
  talk: "🎤",
  workshop: "🛠️",
  keynote: "⭐",
  panel: "👥",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(start: number, end: number): string {
  const minutes = Math.round((end - start) / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function TalkCard({ talk, showTime = true }: TalkCardProps) {
  return (
    <Link href={`/talks/${talk.id}`} className="block">
      <Card className="h-full transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div
              className="h-2 w-2 rounded-full shrink-0 mt-1.5"
              style={{ backgroundColor: talk.track.color }}
              title={talk.track.name}
            />
            <CardTitle className="flex-1 line-clamp-2">{talk.title}</CardTitle>
            <span className="text-lg shrink-0" title={talk.format}>
              {formatIcons[talk.format]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showTime && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>{formatTime(talk.startTime)}</span>
              <span>·</span>
              <span>{formatDuration(talk.startTime, talk.endTime)}</span>
              <span>·</span>
              <span>{talk.room.name}</span>
            </div>
          )}

          <p className="text-muted-foreground line-clamp-2 text-xs">
            {talk.description}
          </p>

          <div className="flex items-center gap-2">
            <Image
              src={talk.speaker.avatar}
              alt={talk.speaker.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{talk.speaker.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {talk.speaker.company}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {talk.track.name}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[10px] ${levelColors[talk.level]}`}
            >
              {talk.level}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
