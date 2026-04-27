import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";

// Single-user private mode: no login required, all records owned by one fixed user
const SINGLE_USER: User = {
  id: 1,
  unionId: "single-user",
  name: "Owner",
  email: null,
  avatar: null,
  role: "admin",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  lastSignInAt: new Date(),
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user: SINGLE_USER,
  };
}
