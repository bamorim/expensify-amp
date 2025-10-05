import { api, HydrateClient } from "~/trpc/server";
import { ExpensesContent } from "./expenses-content";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = await params;

  void api.expense.listMy.prefetch({ organizationId });
  void api.category.list.prefetch({ organizationId });
  void api.organization.getOrganization.prefetch({ organizationId });

  return (
    <HydrateClient>
      <ExpensesContent organizationId={organizationId} />
    </HydrateClient>
  );
}
