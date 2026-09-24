"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import App from "@/App";

function makeQueryClient() {
  const client = new QueryClient();
  const redirect = (error: unknown) => {
    if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
      window.location.href = window.location.pathname.startsWith("/student") ? "/student" : "/admin";
    }
  };
  client.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") redirect(event.query.state.error);
  });
  client.getMutationCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") redirect(event.mutation.state.error);
  });
  return client;
}

export default function ClientApp() {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(() => trpc.createClient({
    links: [httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
    })],
  }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </trpc.Provider>
  );
}
