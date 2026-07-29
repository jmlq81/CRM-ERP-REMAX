import { router } from "./trpc";
import propertyRouter from "./routers/property";
import leadRouter from "./routers/lead";
import taskRouter from "./routers/task";
import userRouter from "./routers/user";

export const appRouter = router({
  property: propertyRouter,
  lead: leadRouter,
  task: taskRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
