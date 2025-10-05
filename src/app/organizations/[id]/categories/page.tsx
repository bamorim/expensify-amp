import { api, HydrateClient } from "~/trpc/server";
import { CategoriesContent } from "./categories-content";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = await params;

  void api.category.list.prefetch({ organizationId });
  void api.organization.getOrganization.prefetch({ organizationId });

  return (
    <HydrateClient>
      <CategoriesContent organizationId={organizationId} />
    </HydrateClient>
  );
}
