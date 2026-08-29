import { router } from "./trpc";
import propertyRouter from "./routers/property";
import interesadoRouter from "./routers/interesado";
import taskRouter from "./routers/task";
import userRouter from "./routers/user";
import dealRouter from "./routers/deal";
import agentRouter from "./routers/agent";
import empresaRouter from "./routers/empresa";

export const appRouter = router({
  property: propertyRouter,
  interesado: interesadoRouter,
  task: taskRouter,
  user: userRouter,
  deal: dealRouter,
  agent: agentRouter,
  empresa: empresaRouter,
});

export type AppRouter = typeof appRouter;