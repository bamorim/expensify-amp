"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
      <h1 className="mb-8 text-3xl font-bold">Team Management</h1>

      {isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>
              Send an invitation to add a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as "ADMIN" | "MEMBER")
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={sendInvitation.isPending}>
                {sendInvitation.isPending ? "Sending..." : "Send Invitation"}
              </Button>

              {sendInvitation.error && (
                <p className="text-sm text-destructive">
                  {sendInvitation.error.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin && invitations && invitations.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {invitation.role} • Expires:{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
