import { betterAuth } from "better-auth";
// import { dbConfig } from "./modules/db";
// import { authorizationPlugins } from "./modules/authorization";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set.");
}

export const auth = betterAuth({
  appName: "NextAdmin",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // database: dbConfig,

  // plugins: [...authorizationPlugins],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});
