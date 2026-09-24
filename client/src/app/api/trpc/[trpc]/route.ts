import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@server/routers";
import { createContext } from "@server/_core/context";

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC] ${path ?? "unknown"}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
