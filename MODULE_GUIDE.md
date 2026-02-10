# Module 1: Error Capture (Hydration Errors)

## The Problem

The theme switcher is broken. When you toggle to dark mode and refresh the page, you'll see a hydration error in the console and in Sentry. The current implementation reads `localStorage` during server-side rendering, causing the server to render `<Sun>` while the client renders `<Moon>` — a mismatch.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Open the app at `localhost:3000`
3. Click the theme toggle to switch to dark mode
4. **Refresh the page** — you'll see a hydration error in the browser console
5. Check Sentry Issues — the hydration error appears automatically

## Files to Modify

- `components/theme-provider.tsx` — replace the broken custom implementation with `next-themes`
- `components/theme-toggle.tsx` — import `useTheme` from `next-themes` instead of the custom provider
- `app/layout.tsx` — wrap children with the new `ThemeProvider` and add `suppressHydrationWarning` to `<html>`

## The Fix

**`components/theme-provider.tsx`** — Replace entirely:

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**`components/theme-toggle.tsx`** — Use `next-themes` and CSS-based icon toggle:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**`app/layout.tsx`** — Update the `<html>` tag and wrap with ThemeProvider:

```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```

## Verify

1. Refresh the page and toggle the theme — no console errors
2. Check Sentry Issues — no new hydration errors
3. The theme persists across page refreshes without a flash
