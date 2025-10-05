"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

interface OrgSelectorProps {
  organizationId: string;
}

export function OrgSelector({ organizationId }: OrgSelectorProps) {
  const router = useRouter();
  const [organizations] = api.organization.getMyOrganizations.useSuspenseQuery();
  const currentOrg = organizations.find((org) => org.id === organizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{currentOrg?.name ?? "Select Organization"} ▼</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => router.push(`/organizations/${org.id}`)}
          >
            {org.name}
            {org.id === organizationId && " ✓"}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations/new">+ Create Organization</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
