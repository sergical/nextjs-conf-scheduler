import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/server";

export default async function SpeakersPage() {
  const api = await trpc();
  const speakers = await api.speakers.list();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Speakers</h1>
          <p className="text-muted-foreground">Meet the speakers at Next.js Conf 2025</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {speakers.map((speaker) => (
            <Link key={speaker.id} href={`/speakers/${speaker.id}`}>
              <Card className="h-full transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
                <CardContent className="pt-6 text-center">
                  <Image
                    src={speaker.avatar}
                    alt={speaker.name}
                    width={96}
                    height={96}
                    className="rounded-full mx-auto mb-4"
                  />
                  <h2 className="font-semibold">{speaker.name}</h2>
                  <p className="text-sm text-muted-foreground">{speaker.role}</p>
                  <p className="text-sm text-muted-foreground">{speaker.company}</p>
                  {speaker.twitter && (
                    <p className="text-sm text-primary mt-2">@{speaker.twitter}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
