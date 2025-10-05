import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { TeamContent } from "./team-content";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const { id: organizationId } = await params;

  void api.organization.getOrganization.prefetch({ organizationId });
  void api.organization.listMembers.prefetch({ organizationId });

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <TeamContent organizationId={organizationId} />
      </main>
    </HydrateClient>
  );
}
