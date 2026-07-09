import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/** Plumbing only in M1. Caching and rate-limiting arrive with the API (M4). */
export function redisClient(): Redis | null {
  const e = env();
  if (!e.UPSTASH_REDIS_REST_URL || !e.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: e.UPSTASH_REDIS_REST_URL,
    token: e.UPSTASH_REDIS_REST_TOKEN,
  });
}
