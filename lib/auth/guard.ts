import { auth } from "@/lib/auth";

/**
 * Server Actions are public HTTP endpoints. The middleware gates *pages*, not
 * actions — a stranger who knows the action ID can POST to it directly. Every
 * mutation calls this first. Rule 7 is enforced here or nowhere.
 */
export async function requireOwner(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const owner = process.env.OWNER_EMAIL?.toLowerCase();

  if (!email || !owner || email !== owner) {
    throw new Error("Unauthorized");
  }
  return email;
}
