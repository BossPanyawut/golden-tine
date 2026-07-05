"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  LayoutDashboard,
  LineChart,
  ListTodo,
  Repeat,
  Settings,
  Sparkles,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks & Projects", icon: ListTodo },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/crm", label: "People", icon: Users },
  { href: "/review", label: "Weekly Review", icon: LineChart },
  { href: "/focus", label: "Focus Timer", icon: Timer },
  { href: "/someday", label: "Someday / Bucket List", icon: Sparkles },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-semibold">Golden Tine</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Life OS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/settings")}
              render={
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
