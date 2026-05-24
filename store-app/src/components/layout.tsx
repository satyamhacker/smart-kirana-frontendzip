import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Truck,
  BarChart3,
  Settings,
  Store,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    hindiName: "डैशबोर्ड",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Billing",
    hindiName: "बिलिंग",
    href: "/billing",
    icon: ShoppingCart,
  },
  {
    name: "Stock",
    hindiName: "स्टॉक",
    href: "/products",
    icon: Package,
  },
  {
    name: "Khata",
    hindiName: "खाता",
    href: "/customers",
    icon: BookOpen,
  },
  {
    name: "Purchase",
    hindiName: "खरीद",
    href: "/purchases",
    icon: Truck,
  },
  {
    name: "Reports",
    hindiName: "रिपोर्ट",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    hindiName: "सेटिंग",
    href: "/settings",
    icon: Settings,
  },
];

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navigation)[0];
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={item.href} onClick={onClick}>
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
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? location === "/dashboard" || location === "/"
      : location.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Smart Kirana
            </span>
            <span className="text-[10px] text-muted-foreground">
              स्मार्ट किराना
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
          {navigation.map((item) => (
            <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Vyapar jitna useful · Khatabook jitna simple
          </p>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 md:hidden flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Smart Kirana</p>
              <p className="text-[10px] text-muted-foreground">स्मार्ट किराना</p>
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-4">
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col min-h-[100dvh] overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold">Smart Kirana</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
