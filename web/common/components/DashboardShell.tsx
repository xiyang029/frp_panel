import type { ComponentType, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { MoonIcon, PanelLeftIcon, SunIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getLoginModalVisible,
  subscribeLoginModal,
} from "@common/composables/loginModal";
import { useDarkMode } from "@common/hooks/useDarkMode";

export interface DashboardMenuItem {
  label: string;
  path: string;
  icon?: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
}

interface DashboardShellProps {
  appTitle: string;
  appSubtitle: string;
  menuItems: DashboardMenuItem[];
  loginModal: ReactNode;
}

export function DashboardShell({
  appTitle,
  appSubtitle,
  menuItems,
  loginModal,
}: DashboardShellProps) {
  const location = useLocation();
  const { isDark, toggleDarkMode } = useDarkMode();
  const loginModalVisible = useSyncExternalStore(
    subscribeLoginModal,
    getLoginModalVisible,
    getLoginModalVisible,
  );

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip={appTitle}
                  className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Link to="/">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      frp
                    </div>
                    <div className="grid flex-1 min-w-0 text-left leading-tight transition-[width,opacity] duration-300 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 overflow-hidden whitespace-nowrap">
                      <span className="truncate text-sm">{appTitle}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {appSubtitle}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>导航</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.match
                      ? item.match(location.pathname)
                      : location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                        >
                          <Link to={item.path}>
                            {Icon ? <Icon className="size-4 shrink-0" /> : null}
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  title="切换主题"
                  className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
                >
                  {isDark ? (
                    <MoonIcon className="size-4 shrink-0" />
                  ) : (
                    <SunIcon className="size-4 shrink-0" />
                  )}
                  <span className="group-data-[collapsible=icon]:hidden">
                    切换主题
                  </span>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="h-12 p-4 flex shrink-0 items-center justify-between border-b">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger>
                <PanelLeftIcon />
              </SidebarTrigger>
              <div className="truncate text-sm font-medium">{appTitle}</div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={loginModalVisible}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>需要登录</DialogTitle>
            <DialogDescription>当前请求需要管理面板认证。</DialogDescription>
          </DialogHeader>
          {loginModal}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
