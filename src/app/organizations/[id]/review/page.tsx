import { api, HydrateClient } from "~/trpc/server";
import { ReviewContent } from "./review-content";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = await params;

  void api.expense.listPending.prefetch({ organizationId });
  void api.organization.getOrganization.prefetch({ organizationId });

  return (
    <HydrateClient>
      <ReviewContent organizationId={organizationId} />
    </HydrateClient>
  );
}
