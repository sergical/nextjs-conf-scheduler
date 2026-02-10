import * as Sentry from "@sentry/nextjs";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getUser, verifySession } from "@/lib/auth/dal";

export const createTRPCContext = async () => {
  const session = await verifySession();

  if (session.isAuth && session.userId) {
    const user = await getUser();
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email, username: user.name });
    }
  }

  return { session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session.isAuth || !ctx.session.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session as { isAuth: true; userId: string },
    },
  });
});
