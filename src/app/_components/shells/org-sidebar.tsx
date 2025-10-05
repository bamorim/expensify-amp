"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { OrgSelector } from "./org-selector";
import { api } from "~/trpc/react";

interface OrgSidebarProps {
  organizationId: string;
  userEmail?: string | null;
}

export function OrgSidebar({ organizationId, userEmail }: OrgSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [organization] = api.organization.getOrganization.useSuspenseQuery({
    organizationId,
  });

  const isAdmin = organization.currentUserRole === "ADMIN";

  const navItems = [
    {
      href: `/organizations/${organizationId}/expenses`,
      label: "My Expenses",
    },
    ...(isAdmin
      ? [
          {
            href: `/organizations/${organizationId}/review`,
            label: "Review Expenses",
          },
        ]
      : []),
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Organization Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-3">
              Organization
            </p>
            <OrgSelector organizationId={organizationId} />
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-3">
              Navigation
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
          </div>

          {/* User Section */}
          <div className="space-y-2 pt-4 border-t">
            {userEmail && (
              <p className="text-sm text-muted-foreground px-3">
                {userEmail}
              </p>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/api/auth/signout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
