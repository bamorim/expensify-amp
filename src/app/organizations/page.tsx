import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { UserShell } from "~/app/_components/shells/user-shell";
import { OrganizationList } from "~/app/_components/organization-list";
import { Button } from "~/components/ui/button";

export default async function OrganizationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  void api.organization.getMyOrganizations.prefetch();

  return (
    <HydrateClient>
      <UserShell>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Your Organizations</h1>
            <Button asChild>
              <Link href="/organizations/new">Create Organization</Link>
            </Button>
          </div>
          <Suspense fallback={<div>Loading organizations...</div>}>
            <OrganizationList />
          </Suspense>
        </div>
      </UserShell>
    </HydrateClient>
  );
}
