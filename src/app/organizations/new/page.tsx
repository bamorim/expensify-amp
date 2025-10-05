import { NewOrganizationForm } from "./new-organization-form";
import { UserShell } from "~/app/_components/shells/user-shell";

export default function NewOrganization() {
  return (
    <UserShell>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-3xl font-bold mb-8">Create Organization</h1>
        <NewOrganizationForm />
      </div>
    </UserShell>
  );
}
