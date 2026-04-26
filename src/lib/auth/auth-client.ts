import { createAuthClient } from "better-auth/react";
// import { authorizationClient } from "./modules/authorization";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  // plugins: [...authorizationClient],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
