import { router } from "./trpc";
import propertyRouter from "./routers/property";
import leadRouter from "./routers/lead";
import taskRouter from "./routers/task";
import userRouter from "./routers/user";
import dealRouter from "./routers/deal";
import agentRouter from "./routers/agent";

export const appRouter = router({
  property: propertyRouter,
  lead: leadRouter,
  task: taskRouter,
  user: userRouter,
  deal: dealRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
