"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export function NewOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");

  const createOrg = api.organization.create.useMutation({
    onSuccess: (org) => {
      router.push(`/organizations/${org.id}`);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createOrg.mutate({ name });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Organization Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter organization name"
          required
        />
      </div>

      <Button type="submit" disabled={createOrg.isPending}>
        {createOrg.isPending ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
}
