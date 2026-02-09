import { Header } from "@/components/header";
import { ScheduleFilters } from "@/components/schedule-filters";
import { ScheduleGrid } from "@/components/schedule-grid";
import { trpc } from "@/lib/trpc/server";

type SearchParams = Promise<{
  track?: string;
  level?: string;
  format?: string;
}>;

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const api = await trpc();

  // Fetch all talks and tracks
  const [allTalks, tracks] = await Promise.all([api.talks.list(), api.talks.tracks()]);

  let filteredTalks = allTalks;

  // Apply filters
  if (params.track) {
    filteredTalks = filteredTalks.filter((talk) => talk.track.id === params.track);
  }
  if (params.level) {
    filteredTalks = filteredTalks.filter((talk) => talk.level === params.level);
  }
  if (params.format) {
    filteredTalks = filteredTalks.filter((talk) => talk.format === params.format);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Conference Schedule</h1>
          <p className="text-muted-foreground">October 22, 2025 · San Francisco, CA</p>
        </div>

        <div className="mb-8">
          <ScheduleFilters tracks={tracks} />
        </div>

        <ScheduleGrid talks={filteredTalks} />
      </main>
    </div>
  );
}
