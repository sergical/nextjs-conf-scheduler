# Module 1: Error Capture (Hydration Errors)

## The Problem

The theme switcher is broken. When you toggle between light/dark mode, you'll see a hydration error in the console and in Sentry. The current implementation reads `localStorage` during server-side rendering, which causes a mismatch between the server-rendered HTML and the client-rendered HTML.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Open the app at `localhost:3000`
3. Click the theme toggle (sun/moon icon)
4. Open the browser console — you'll see a hydration error
5. Check Sentry Issues — the hydration error appears automatically

## Files to Modify

- `components/theme-provider.tsx` — replace the broken custom implementation with `next-themes`
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
3. The theme persists across page refreshes
