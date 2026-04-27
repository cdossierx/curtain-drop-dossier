import { createRouter, publicQuery } from "./middleware";

const SINGLE_USER = {
  id: 1,
  unionId: "single-user",
  name: "Owner",
  email: null,
  avatar: null,
  role: "admin" as const,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  lastSignInAt: new Date(),
};

export const authRouter = createRouter({
  me: publicQuery.query(() => SINGLE_USER),
  logout: publicQuery.mutation(() => ({ success: true })),
});
