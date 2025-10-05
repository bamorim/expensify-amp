import { api, HydrateClient } from "~/trpc/server";
import { TeamContent } from "./team-content";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = await params;

  void api.organization.getOrganization.prefetch({ organizationId });
  void api.organization.listMembers.prefetch({ organizationId });

  return (
    <HydrateClient>
      <TeamContent organizationId={organizationId} />
    </HydrateClient>
  );
}
