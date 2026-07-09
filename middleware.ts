import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Edge-safe: uses the adapter-free config.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/studio/:path*"],
};
