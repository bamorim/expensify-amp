"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrgDesktopSidebarProps {
  organizationId: string;
}

export function OrgDesktopSidebar({ organizationId }: OrgDesktopSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: `/organizations/${organizationId}/expenses`,
      label: "My Expenses",
    },
    {
      href: `/organizations/${organizationId}/team`,
      label: "Team",
    },
    {
      href: `/organizations/${organizationId}/categories`,
      label: "Categories",
    },
    {
      href: `/organizations/${organizationId}/policies`,
      label: "Policies",
    },
  ];

  return (
    <aside className="hidden md:block w-64 border-r">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
