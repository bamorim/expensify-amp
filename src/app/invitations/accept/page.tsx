"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "~/trpc/react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invitationQuery = api.invitation.getInvitationDetails.useQuery(
    { token: token ?? "" },
    { enabled: !!token },
  );

  const acceptInvitation = api.invitation.acceptInvitation.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-white">Invalid Invitation</h1>
        <p className="text-white/70">No invitation token provided.</p>
      </div>
    );
  }

  if (invitationQuery.isLoading) {
    return <div className="text-center text-white">Loading invitation...</div>;
  }

  if (invitationQuery.error) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-white">Invalid Invitation</h1>
        <p className="text-white/70">{invitationQuery.error.message}</p>
      </div>
    );
  }

  const invitation = invitationQuery.data;

  if (!invitation) {
    return null;
  }

  return (
    <div className="w-full max-w-md text-center">
      <h1 className="mb-4 text-4xl font-extrabold text-white">
        Join {invitation.organization.name}
      </h1>
      <p className="mb-8 text-white/70">
        You&apos;ve been invited to join as a {invitation.role.toLowerCase()}
      </p>

      {acceptInvitation.error && (
        <p className="mb-4 text-sm text-red-300">{acceptInvitation.error.message}</p>
      )}

      <button
        onClick={() => acceptInvitation.mutate({ token })}
        disabled={acceptInvitation.isPending}
        className="w-full rounded-lg bg-white/10 px-10 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
      >
        {acceptInvitation.isPending ? "Accepting..." : "Accept Invitation"}
      </button>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <AcceptInvitationContent />
        </Suspense>
      </div>
    </main>
  );
}
