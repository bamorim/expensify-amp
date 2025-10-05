"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function TeamContent({ organizationId }: { organizationId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const utils = api.useUtils();
  const [organization] = api.organization.getOrganization.useSuspenseQuery({
    organizationId,
  });
  const [members] = api.organization.listMembers.useSuspenseQuery({
    organizationId,
  });

  const isAdmin = organization.currentUserRole === "ADMIN";

  const { data: invitations } = api.invitation.listPendingInvitations.useQuery(
    { organizationId },
    { enabled: isAdmin },
  );

  const sendInvitation = api.invitation.sendInvitation.useMutation({
    onSuccess: async () => {
      await utils.invitation.listPendingInvitations.invalidate();
      setEmail("");
      setRole("MEMBER");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      sendInvitation.mutate({ organizationId, email, role });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-extrabold text-white">
        Team Management
      </h1>

      {isAdmin && (
        <div className="mb-8 rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Invite Member</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-white"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20"
                placeholder="colleague@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-white"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none focus:bg-white/20"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sendInvitation.isPending}
              className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              {sendInvitation.isPending ? "Sending..." : "Send Invitation"}
            </button>

            {sendInvitation.error && (
              <p className="text-sm text-red-300">
                {sendInvitation.error.message}
              </p>
            )}
          </form>
        </div>
      )}

      {isAdmin && invitations && invitations.length > 0 && (
        <div className="mb-8 rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg bg-white/5 p-4"
              >
                <div>
                  <p className="font-medium text-white">{invitation.email}</p>
                  <p className="text-sm text-white/70">
                    Role: {invitation.role} • Expires:{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/10 p-6">
        <h2 className="mb-4 text-2xl font-bold text-white">Team Members</h2>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-white/5 p-4"
            >
              <div>
                <p className="font-medium text-white">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-sm text-white/70">{member.user.email}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
