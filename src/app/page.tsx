import Link from "next/link";
import { BasicShell } from "~/app/_components/shells/basic-shell";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <BasicShell>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <h1 className="text-5xl font-extrabold tracking-tight mb-8">
          Expense Management for Companies
        </h1>
        <p className="text-xl text-muted-foreground mb-8 text-center max-w-2xl">
          Track expenses, manage policies, and streamline approvals all in one
          place.
        </p>
        <div className="flex gap-4">
          {session ? (
            <Button asChild size="lg">
              <Link href="/organizations">Go to Organizations</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/api/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </BasicShell>
  );
}
