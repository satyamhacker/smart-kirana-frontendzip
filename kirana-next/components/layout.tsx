"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  BarChart3,
  Settings,
  Store,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarNav = [
  { name: "Dashboard", hindiName: "डैशबोर्ड", href: "/dashboard", icon: LayoutDashboard },
  { name: "Billing", hindiName: "बिलिंग", href: "/billing", icon: ShoppingCart },
  { name: "Stock", hindiName: "स्टॉक", href: "/products", icon: Package },
  { name: "Khata", hindiName: "खाता", href: "/customers", icon: BookOpen },
  { name: "Reports", hindiName: "रिपोर्ट", href: "/reports", icon: BarChart3 },
  { name: "Settings", hindiName: "सेटिंग", href: "/settings", icon: Settings },
];

const bottomNav = [
  { name: "Home", hindiName: "होम", href: "/dashboard", icon: LayoutDashboard },
  { name: "Billing", hindiName: "बिलिंग", href: "/billing", icon: ShoppingCart },
  { name: "Stock", hindiName: "स्टॉक", href: "/products", icon: Package },
  { name: "Khata", hindiName: "खाता", href: "/customers", icon: BookOpen },
  { name: "More", hindiName: "अधिक", href: "#more", icon: MoreHorizontal },
];

const moreItems = [
  { name: "Reports", hindiName: "रिपोर्ट", href: "/reports", icon: BarChart3 },
  { name: "Settings", hindiName: "सेटिंग", href: "/settings", icon: Settings },
];

function SidebarNavItem({
  item,
  isActive,
}: {
  item: (typeof sidebarNav)[0];
  isActive: boolean;
}) {
  return (
    <Link href={item.href}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        data-testid={`nav-${item.name.toLowerCase()}`}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm">{item.name}</span>
          <span
            className={cn(
              "text-[11px] font-normal",
              isActive ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {item.hindiName}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href);

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-foreground">Smart Kirana</span>
            <span className="text-[10px] text-muted-foreground">स्मार्ट किराना</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
          {sidebarNav.map((item) => (
            <SidebarNavItem key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Vyapar jitna useful · Khatabook jitna simple
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col min-h-[100dvh] overflow-hidden">
        {/* Mobile Top Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold">Smart Kirana</span>
          </div>
          <span className="text-xs text-muted-foreground">स्मार्ट किराना</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
        <div className="flex items-stretch h-16">
          {bottomNav.map((item) => {
            const active = item.href === "#more" ? isMoreActive : isActive(item.href);
            const isMore = item.href === "#more";

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                    isMoreActive ? "text-primary" : "text-muted-foreground"
                  )}
                  data-testid="nav-more"
                >
                  <item.icon className={cn("h-5 w-5", isMoreActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-[10px] font-medium">{item.hindiName}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                {item.href === "/billing" ? (
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                    active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                )}
                {item.href !== "/billing" && (
                  <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                    {item.hindiName}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Sheet Overlay */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t bg-card p-5 shadow-xl md:hidden">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm">More Options</p>
              <button
                className="rounded-lg p-1.5 hover:bg-muted"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.hindiName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
