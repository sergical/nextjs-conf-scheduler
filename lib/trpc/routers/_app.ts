import { router } from "../init";
import { talksRouter } from "./talks";
import { speakersRouter } from "./speakers";
import { scheduleRouter } from "./schedule";

export const appRouter = router({
  talks: talksRouter,
  speakers: speakersRouter,
  schedule: scheduleRouter,
});

export type AppRouter = typeof appRouter;
