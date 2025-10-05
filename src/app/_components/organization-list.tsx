"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export function OrganizationList() {
  const [organizations] = api.organization.getMyOrganizations.useSuspenseQuery();

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-8">
        <p className="text-lg text-white">You don&apos;t have any organizations yet.</p>
        <Link
          href="/organizations/new"
          className="rounded-lg bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
        >
          Create Your First Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Organizations</h2>
        <Link
          href="/organizations/new"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          + New Organization
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {organizations.map((org) => (
          <Link
            key={org.id}
            href={`/organizations/${org.id}/team`}
            className="flex flex-col gap-2 rounded-xl bg-white/10 p-6 transition hover:bg-white/20"
          >
            <h3 className="text-xl font-bold text-white">{org.name}</h3>
            <p className="text-sm text-white/70">Role: {org.role}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
