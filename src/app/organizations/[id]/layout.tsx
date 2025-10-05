import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { OrgShell } from "~/app/_components/shells/org-shell";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrgShell organizationId={id}>{children}</OrgShell>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  if (!id) {
    redirect("/organizations");
  }
  
  return {
    title: "Organization",
  };
}
