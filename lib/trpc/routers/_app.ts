import { router } from "../init";
import { scheduleRouter } from "./schedule";
import { speakersRouter } from "./speakers";
import { talksRouter } from "./talks";

export const appRouter = router({
  talks: talksRouter,
  speakers: speakersRouter,
  schedule: scheduleRouter,
});

export type AppRouter = typeof appRouter;
