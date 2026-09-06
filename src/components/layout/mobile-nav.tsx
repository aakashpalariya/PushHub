"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Bell,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Saved", href: "/notifications", icon: Bell },
  { label: "Create", href: "/notifications/new", icon: PlusCircle, highlight: true },
  { label: "Templates", href: "/templates", icon: Sparkles },
  { label: "Devices", href: "/devices", icon: Smartphone },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-2 py-1.5 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/notifications/new"
              ? pathname === "/notifications/new" ||
                (pathname.startsWith("/notifications/") && pathname !== "/notifications")
              : item.href === "/notifications"
              ? pathname === "/notifications"
              : item.href === "/templates"
              ? pathname === "/templates" || (pathname.startsWith("/templates/") && !pathname.startsWith("/notifications/"))
              : pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center -mt-6 focus:outline-none select-none"
              >
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-primary/50 scale-105 border-2 border-background"
                      : "bg-card text-muted-foreground hover:text-foreground border border-border shadow-md"
                  )}
                >
                  <PlusCircle
                    className={cn(
                      "h-5 w-5 stroke-[2] transition-colors",
                      isActive ? "text-white" : "text-primary/80 group-hover:text-primary"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-1 transition-colors",
                    isActive
                      ? "font-bold text-primary"
                      : "font-medium text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1.5 px-3 rounded-xl font-medium transition-colors",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
