import "server-only";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { appRouter } from "./routers/_app";

export const trpc = cache(async () => {
  const ctx = await createTRPCContext();
  return appRouter.createCaller(ctx);
});
