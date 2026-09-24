import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../database/schema";
import { sessionService } from "./session";

export type TrpcContext = {
  req: Request;
  responseHeaders: Headers;
  user: User | null;
  setCookie(name: string, value: string, maxAge: number): void;
  clearCookie(name: string): void;
};

function cookieValue(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge / 1000)}${secure}`;
}

export async function createContext({ req, resHeaders }: FetchCreateContextFnOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sessionService.authenticateRequest(req);
  } catch {
    user = null;
  }

  return {
    req,
    responseHeaders: resHeaders,
    user,
    setCookie(name, value, maxAge) {
      resHeaders.append("set-cookie", cookieValue(name, value, maxAge));
    },
    clearCookie(name) {
      resHeaders.append("set-cookie", cookieValue(name, "", 0));
    },
  };
}
