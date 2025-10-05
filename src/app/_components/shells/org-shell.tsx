import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { OrgSelector } from "./org-selector";

interface OrgShellProps {
  children: ReactNode;
  organizationId: string;
}

export async function OrgShell({ children, organizationId }: OrgShellProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  void api.organization.getMyOrganizations.prefetch();
  const organizations = await api.organization.getMyOrganizations();
  const currentOrg = organizations.find((org) => org.id === organizationId);

  if (!currentOrg) {
    redirect("/organizations");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold">Expensify</h1>
          </Link>
          <div className="flex items-center gap-4">
            <HydrateClient>
              <OrgSelector organizationId={organizationId} />
            </HydrateClient>
            <span className="text-sm text-muted-foreground">
              {session.user.email}
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
