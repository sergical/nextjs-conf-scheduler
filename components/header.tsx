import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { verifySession } from "@/lib/auth/dal";

export async function Header() {
  const session = await verifySession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">Next.js Conf 2025</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Schedule
            </Link>
            <Link
              href="/speakers"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Speakers
            </Link>
            {session.isAuth && (
              <>
                <Link
                  href="/my-schedule"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Schedule
                </Link>
                <Link
                  href="/ai-builder"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI Builder
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session.isAuth ? (
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
