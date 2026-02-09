export type Talk = {
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

export const levelColors = {
  beginner: "bg-green-500/10 text-green-700 dark:text-green-400",
  intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  advanced: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDuration(start: number, end: number): string {
  const minutes = Math.round((end - start) / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
