import { api, HydrateClient } from "~/trpc/server";
import { PoliciesContent } from "./policies-content";

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = await params;

  void api.policy.list.prefetch({ organizationId });
  void api.category.list.prefetch({ organizationId });
  void api.organization.getOrganization.prefetch({ organizationId });
  void api.organization.listMembers.prefetch({ organizationId });

  return (
    <HydrateClient>
      <PoliciesContent organizationId={organizationId} />
    </HydrateClient>
  );
}
