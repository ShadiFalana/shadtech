"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Box,
  Briefcase,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  Home,
  Inbox,
  Layers3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Plus,
  Repeat2,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  UsersRound,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { signOut } from "@/lib/auth-client";
import { translateKey } from "@/lib/dictionaries";
import {
  findNavItem,
  getWorkspaceNav,
  workspaceMeta,
  type NavGroup,
  type NavIcon,
  type Workspace,
} from "@/lib/navigation";
import { cn } from "cn";

const iconMap: Record<NavIcon, LucideIcon> = {
  layout: LayoutDashboard,
  ticket: Ticket,
  plus: Plus,
  wrench: Wrench,
  message: MessageSquareText,
  calendar: CalendarDays,
  box: Box,
  file: FileText,
  credit: CreditCard,
  repeat: Repeat2,
  book: BookOpen,
  help: HelpCircle,
  sparkles: Sparkles,
  bell: Bell,
  mail: Mail,
  user: UserRound,
  shield: ShieldCheck,
  settings: Settings2,
  users: UsersRound,
  building: Building2,
  inbox: Inbox,
  alert: AlertTriangle,
  clock: Clock3,
  chart: ChartNoAxesCombined,
  briefcase: Briefcase,
  layers: Layers3,
  server: Server,
  activity: Activity,
  workflow: Workflow,
  plug: PlugZap,
  search: Search,
  globe: Globe2,
};

export type WorkspaceUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
};

export type WorkspaceNotification = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  isRead: boolean;
  createdAt: string;
};

const collapsedKey = "shadtech-sidebar-collapsed";
const collapsedListeners = new Set<() => void>();
let cachedCollapsed: boolean | null = null;

function readCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(collapsedKey) === "true";
  } catch {
    return false;
  }
}

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  const handleStorage = () => {
    cachedCollapsed = readCollapsed();
    listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  cachedCollapsed = readCollapsed();
  return () => {
    collapsedListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
    if (collapsedListeners.size === 0) cachedCollapsed = null;
  };
}

function getCollapsedSnapshot() {
  return cachedCollapsed ?? false;
}

function getCollapsedServerSnapshot() {
  return false;
}

function setCollapsedValue(value: boolean) {
  cachedCollapsed = value;
  try {
    window.localStorage.setItem(collapsedKey, String(value));
  } catch {
    // Storage may be unavailable; the sidebar still collapses for this session.
  }
  collapsedListeners.forEach((listener) => listener());
}

function safeHref(href?: string | null, fallback = "/") {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return fallback;
  return href;
}

function initialsFor(user?: WorkspaceUser) {
  const value = user?.name || user?.email || "S";
  return value.slice(0, 2).toUpperCase();
}

export function DashboardShell({
  workspace,
  titleKey,
  user,
  notifications = [],
  children,
}: {
  workspace: Workspace;
  titleKey?: string;
  user?: WorkspaceUser;
  notifications?: WorkspaceNotification[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useLanguage();
  const meta = workspaceMeta[workspace];
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, getCollapsedServerSnapshot);
  const [navQuery, setNavQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const [isPending, startTransition] = useTransition();

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    setMobileOpen(false);
  }

  function toggleCollapsed() {
    setCollapsedValue(!collapsed);
  }

  const groups = useMemo(() => {
    const source = getWorkspaceNav(workspace, user?.role);
    const needle = navQuery.trim().toLowerCase();
    if (!needle) return source;
    return source
      .map((group) => ({
        ...group,
        items: group.items.filter((entry) =>
          `${translateKey(t, entry.labelKey) ?? ""} ${entry.href}`.toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navQuery, t, user?.role, workspace]);

  const resolvedTitle = (titleKey ? translateKey(t, titleKey) : undefined) ?? translateKey(t, meta.titleKey) ?? t.portal.title;
  const unreadCount = notifications.filter((entry) => !entry.isRead).length;
  const currentItem = findNavItem(workspace, pathname, user?.role);
  const breadcrumbLabel = currentItem
    ? translateKey(t, currentItem.labelKey) ?? currentItem.labelKey
    : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? resolvedTitle;

  function signOutUser() {
    startTransition(async () => {
      await signOut();
      router.push(`/auth/${meta.login}/login`);
      router.refresh();
    });
  }

  function readNotification(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function readAllNotifications() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  const sidebar = (isMobile: boolean) => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <Link href={meta.homeHref} className={cn("block", collapsed && !isMobile && "hidden")}>
          <Logo light />
        </Link>
        {!isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            className="text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={translateKey(t, collapsed ? "shell.expandSidebar" : "shell.collapseSidebar")}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        )}
      </div>

      {(!collapsed || isMobile) && (
        <div className="relative px-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-white/50" />
          <Input
            value={navQuery}
            onChange={(event) => setNavQuery(event.target.value)}
            placeholder={t.shell.filterNavigation}
            aria-label={t.shell.filterNavigation}
            className="h-9 border-white/10 bg-white/10 ps-10 pe-3 text-xs text-white placeholder:text-white/50 focus-visible:border-brand-orange"
          />
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-1 pb-4" aria-label={t.nav.main}>
        {groups.length === 0 && (
          <p className="px-3 text-xs text-white/60">{t.shell.noNavMatches}</p>
        )}
        {groups.map((group: NavGroup) => (
          <div key={group.id}>
            {(!collapsed || isMobile) && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange-light">
                {translateKey(t, group.labelKey) ?? group.labelKey}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((entry) => {
                const Icon = iconMap[entry.icon] ?? LayoutDashboard;
                const label = translateKey(t, entry.labelKey) ?? entry.labelKey;
                const home = entry.href === meta.homeHref;
                const isActive = home ? pathname === entry.href : pathname === entry.href || pathname.startsWith(`${entry.href}/`);
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    title={collapsed && !isMobile ? label : undefined}
                    aria-label={collapsed && !isMobile ? label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && !isMobile && "justify-center px-2",
                      isActive
                        ? "bg-brand-orange text-brand-ink shadow-[0_8px_20px_-12px_rgba(247,148,50,0.9)]"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                      entry.unavailable && !isActive && "opacity-70",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {(!collapsed || isMobile) && <span className="min-w-0 flex-1 truncate">{label}</span>}
                    {(!collapsed || isMobile) && entry.unavailable && (
                      <span className="size-1.5 shrink-0 rounded-full bg-white/40" title={t.unavailable.title} />
                    )}
                    {isActive && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-brand-orange-light" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={signOutUser}
          disabled={isPending}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60",
            collapsed && !isMobile && "justify-center px-2",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {(!collapsed || isMobile) && t.common.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink dark:bg-brand-ink dark:text-white">
      <aside
        className={cn(
          "brand-gradient hidden shrink-0 border-e border-white/10 p-3 transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-20" : "w-72",
        )}
      >
        {sidebar(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur dark:bg-brand-charcoal/95">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  className="inline-flex size-9 items-center justify-center rounded-full hover:bg-brand-canvas dark:hover:bg-white/10"
                  aria-label={t.nav.main}
                >
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent side={dir === "rtl" ? "left" : "right"} closeLabel={t.common.close} className="brand-gradient w-[85%] max-w-sm border-0 p-3 text-white">
                  <SheetTitle className="sr-only">{t.nav.main}</SheetTitle>
                  {sidebar(true)}
                </SheetContent>
              </Sheet>
              <Link href="/" className="flex size-9 items-center justify-center rounded-full hover:bg-brand-canvas dark:hover:bg-white/10" aria-label={t.nav.home}>
                <Home className="size-4" />
              </Link>
            </div>

            <nav aria-label={t.shell.breadcrumbHome} className="hidden min-w-0 flex-1 items-center gap-2 text-sm md:flex">
              <Link href={meta.homeHref} className="text-muted-foreground hover:text-foreground">
                {resolvedTitle}
              </Link>
              <span className="text-muted-foreground/60">/</span>
              <span className="truncate font-semibold text-foreground">{breadcrumbLabel}</span>
            </nav>
            <p className="min-w-0 flex-1 truncate font-semibold md:hidden">{breadcrumbLabel}</p>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href={meta.searchHref}
                className="hidden h-9 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground hover:bg-brand-canvas dark:hover:bg-white/10 lg:inline-flex"
              >
                <Search className="size-4" />
                <span>{t.common.search}</span>
              </Link>
              <Link
                href={meta.searchHref}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-canvas dark:hover:bg-white/10 lg:hidden"
                aria-label={t.common.search}
              >
                <Search className="size-4" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-canvas dark:hover:bg-white/10"
                  aria-label={t.shell.openNotifications}
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 end-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-brand-ink">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2">
                  <div className="flex items-center justify-between px-2 py-2">
                    <span className="text-xs font-medium text-muted-foreground p-0">{t.common.notifications}</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={readAllNotifications}
                        disabled={isPending}
                        className="text-xs font-semibold text-brand-orange hover:underline disabled:opacity-50"
                      >
                        {t.shell.markAllRead}
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t.shell.noNotifications}</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 12).map((notification) => (
                        <div key={notification.id} className="flex flex-col items-start gap-1 rounded-md px-2 py-2.5">
                          <div className="flex w-full items-start justify-between gap-2">
                            <span className="text-sm font-semibold">{notification.title}</span>
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => readNotification(notification.id)}
                                disabled={isPending}
                                className="shrink-0 text-xs text-brand-orange hover:underline disabled:opacity-50"
                              >
                                {t.shell.markRead}
                              </button>
                            )}
                          </div>
                          {notification.body && (
                            <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => router.push(safeHref(notification.href, meta.notificationsHref))}
                            className="text-xs font-semibold text-brand-orange hover:underline"
                          >
                            {t.actions.viewRecord}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem closeOnClick render={<Link href={meta.notificationsHref} />}>
                    {t.shell.openNotifications}
                  </DropdownMenuLinkItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <LanguageToggle compact />
              <ThemeToggle compact />

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-brand-canvas dark:hover:bg-white/10"
                  aria-label={t.shell.userMenu}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-charcoal text-xs font-bold text-white dark:bg-brand-orange dark:text-brand-ink">
                    {initialsFor(user)}
                  </span>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 py-2">
                    <p className="truncate text-sm font-semibold">{user?.name ?? user?.email ?? t.portal.profile}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{user?.email ?? ""}</p>
                    {user?.role && (
                      <p className="mt-1 text-xs text-brand-orange">
                        {translateKey(t, `roles.${user.role}`) ?? user.role}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem closeOnClick render={<Link href="/profile" />}>
                    <UserRound className="me-2 size-4" /> {t.shell.viewProfile}
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem closeOnClick render={<Link href="/dashboard/settings" />}>
                    <Settings2 className="me-2 size-4" /> {t.common.settings}
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem closeOnClick render={<Link href={meta.notificationsHref} />}>
                    <Bell className="me-2 size-4" /> {t.common.notifications}
                  </DropdownMenuLinkItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser} disabled={isPending}>
                    <LogOut className="me-2 size-4" /> {t.common.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="section-shell py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
