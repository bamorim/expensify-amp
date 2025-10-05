"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function OrganizationList() {
  const [organizations] =
    api.organization.getMyOrganizations.useSuspenseQuery();

  if (organizations.length === 0) {
    return (
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle>No Organizations Yet</CardTitle>
          <CardDescription>
            Create your first organization to get started
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 flex justify-center">
          <Button asChild>
            <Link href="/organizations/new">Create Organization</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Link key={org.id} href={`/organizations/${org.id}`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>Role: {org.role}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
