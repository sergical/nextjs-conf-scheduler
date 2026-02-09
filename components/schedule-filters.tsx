"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

type Track = {
  id: string;
  name: string;
  color: string;
};

type ScheduleFiltersProps = {
  tracks: Track[];
};

const levels = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;

const formats = [
  { id: "keynote", label: "Keynote" },
  { id: "talk", label: "Talk" },
  { id: "workshop", label: "Workshop" },
  { id: "panel", label: "Panel" },
] as const;

export function ScheduleFilters({ tracks }: ScheduleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTrack = searchParams.get("track");
  const activeLevel = searchParams.get("level");
  const activeFormat = searchParams.get("format");

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("/", { scroll: false });
  }, [router]);

  const hasActiveFilters = activeTrack || activeLevel || activeFormat;

  return (
    <div className="space-y-4">
      {/* Track filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Track:</span>
        {tracks.map((track) => (
          <Button
            key={track.id}
            variant={activeTrack === track.id ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("track", track.id)}
            className="gap-1.5"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: track.color }} />
            {track.name}
          </Button>
        ))}
      </div>

      {/* Level filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Level:</span>
        {levels.map((level) => (
          <Button
            key={level.id}
            variant={activeLevel === level.id ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("level", level.id)}
          >
            {level.label}
          </Button>
        ))}
      </div>

      {/* Format filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Format:</span>
        {formats.map((format) => (
          <Button
            key={format.id}
            variant={activeFormat === format.id ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("format", format.id)}
          >
            {format.label}
          </Button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
