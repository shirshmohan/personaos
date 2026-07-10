import { beforeEach, describe, expect, it } from "vitest";
import { authConfig } from "@/lib/auth/config";

const OWNER = "owner@example.com";

/** The signIn callback is the allowlist. Everything else is chrome. */
const signIn = authConfig.callbacks.signIn!;
const authorized = authConfig.callbacks.authorized!;

function attempt(profile: Record<string, unknown> | undefined) {
  // Only `profile` is read by the callback; the rest of the Auth.js payload
  // is irrelevant to the allowlist decision.
  return signIn({ profile } as never);
}

function request(pathname: string) {
  return { nextUrl: { pathname } } as never;
}

describe("studio allowlist (D10)", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = OWNER;
  });

  it("admits the owner", () => {
    expect(attempt({ email: OWNER, email_verified: true })).toBe(true);
  });

  it("is case-insensitive about the owner's address", () => {
    expect(attempt({ email: "Owner@Example.COM", email_verified: true })).toBe(
      true,
    );
  });

  it("refuses any other Google account", () => {
    expect(
      attempt({ email: "stranger@example.com", email_verified: true }),
    ).toBe(false);
  });

  it("refuses an unverified address, even the owner's", () => {
    expect(attempt({ email: OWNER, email_verified: false })).toBe(false);
  });

  it("refuses a missing profile", () => {
    expect(attempt(undefined)).toBe(false);
  });

  it("refuses everyone when OWNER_EMAIL is unset", () => {
    delete process.env.OWNER_EMAIL;
    expect(attempt({ email: OWNER, email_verified: true })).toBe(false);
  });
});

describe("route gating", () => {
  it("keeps a signed-out visitor out of /studio", () => {
    expect(authorized({ auth: null, request: request("/studio") } as never)).toBe(
      false,
    );
  });

  it("lets a signed-in owner into /studio", () => {
    expect(
      authorized({
        auth: { user: { email: OWNER } },
        request: request("/studio/writing"),
      } as never),
    ).toBe(true);
  });

  it("always allows the sign-in page (no redirect loop)", () => {
    expect(
      authorized({ auth: null, request: request("/studio/sign-in") } as never),
    ).toBe(true);
  });

  it("leaves the public site open", () => {
    expect(authorized({ auth: null, request: request("/") } as never)).toBe(
      true,
    );
  });
});
