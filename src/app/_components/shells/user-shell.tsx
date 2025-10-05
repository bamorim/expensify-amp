import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";

interface UserShellProps {
  children: ReactNode;
}

export async function UserShell({ children }: UserShellProps) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold">Expensify</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <Button variant="outline" asChild>
              <Link href="/api/auth/signout">Sign Out</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
