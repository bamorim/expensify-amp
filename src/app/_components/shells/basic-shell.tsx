import type { ReactNode } from "react";

interface BasicShellProps {
  children: ReactNode;
}

export function BasicShell({ children }: BasicShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Expensify</h1>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
