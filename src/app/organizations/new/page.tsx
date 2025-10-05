"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function NewOrganization() {
  const router = useRouter();
  const [name, setName] = useState("");

  const createOrg = api.organization.create.useMutation({
    onSuccess: () => {
      router.push("/");
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Create Organization
        </h1>

        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-white"
              >
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20"
                placeholder="Enter organization name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={createOrg.isPending}
              className="rounded-lg bg-white/10 px-10 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              {createOrg.isPending ? "Creating..." : "Create Organization"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
