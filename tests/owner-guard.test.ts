import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server Actions are public HTTP endpoints. `middleware.ts` gates *pages*, so
 * a stranger who learns an action ID can POST to it directly, bypassing every
 * route check. requireOwner() is the only thing standing there.
 */
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));

const { requireOwner } = await import("@/lib/auth/guard");

const OWNER = "owner@example.com";

describe("requireOwner", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = OWNER;
    authMock.mockReset();
  });

  it("admits the owner", async () => {
    authMock.mockResolvedValue({ user: { email: OWNER } });
    await expect(requireOwner()).resolves.toBe(OWNER);
  });

  it("is case-insensitive", async () => {
    authMock.mockResolvedValue({ user: { email: "OWNER@Example.com" } });
    await expect(requireOwner()).resolves.toBe(OWNER);
  });

  it("throws for a signed-in stranger", async () => {
    authMock.mockResolvedValue({ user: { email: "stranger@example.com" } });
    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });

  it("throws when there is no session at all", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });

  it("throws when the session has no email", async () => {
    authMock.mockResolvedValue({ user: {} });
    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });

  it("fails closed when OWNER_EMAIL is unset — never open", async () => {
    delete process.env.OWNER_EMAIL;
    authMock.mockResolvedValue({ user: { email: OWNER } });
    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });
});
