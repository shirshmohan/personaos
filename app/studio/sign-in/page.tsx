import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign in" };

/**
 * Deliberately OUTSIDE the (workbench) route group: that group's layout
 * redirects unauthenticated visitors here, and wrapping this page in it
 * would create a redirect loop.
 */
export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-(--spacing-gutter)">
      <h1 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight">
        Studio
      </h1>
      <p className="mt-2 text-sm text-(--color-ink-muted)">
        This Studio has one owner. Sign in to continue.
      </p>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/studio" });
        }}
      >
        <Button type="submit" className="w-full">
          Continue with Google
        </Button>
      </form>
    </div>
  );
}
