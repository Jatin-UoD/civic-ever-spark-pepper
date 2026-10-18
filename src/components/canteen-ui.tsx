import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { friendlyError, STATUS_LABEL } from "@/lib/canteen/domain";
import { getMe, listNotifications, markNotificationsRead } from "@/lib/canteen/api";

export function inr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export function errMsg(error: unknown): string {
  if (error instanceof Error) return friendlyError(error.message);
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return friendlyError(error.message);
  }
  return "Something went wrong. Try again.";
}

export function DietMark({ diet }: { diet: string }) {
  const veg = diet === "veg";
  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm border-2 ${veg ? "border-leaf" : "border-chili"}`}
      title={veg ? "Vegetarian" : diet === "egg" ? "Contains egg" : "Non-vegetarian"}
      aria-label={veg ? "Vegetarian" : diet === "egg" ? "Contains egg" : "Non-vegetarian"}
    >
      <span className={`size-1.5 rounded-full ${veg ? "bg-leaf" : "bg-chili"}`} />
    </span>
  );
}

export function StatusPill({ value }: { value: string }) {
  const label = STATUS_LABEL[value] ?? value;
  const tone =
    value === "AVAILABLE" || value === "OPEN" || value === "PAID" || value === "PICKED_UP" || value === "READY_FOR_PICKUP"
      ? "bg-leaf/10 text-leaf"
      : value === "CLOSED" || value === "SOLD_OUT" || value === "FAILED" || value === "CANCELLED" || value === "UNAVAILABLE"
        ? "bg-chili/10 text-chili"
        : "bg-line text-ink";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <div className="h-8 w-40 animate-pulse rounded-full bg-line" />
        <div className="mt-6 h-28 animate-pulse rounded-3xl bg-foam" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return children;
}

export function useMe() {
  const { user, isPending } = useCurrentUserState();
  const query = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => getMe(),
    enabled: Boolean(user),
  });
  return { user, isPending, me: query.data ?? null, loadingMe: query.isLoading };
}

export function Shell({
  title,
  back,
  children,
}: {
  title?: string;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  const { user, isPending, me } = useMe();
  const [notesOpen, setNotesOpen] = useState(false);
  const roles = new Set(me?.memberships.map((m) => m.role) ?? []);
  const notes = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user),
    refetchInterval: 4000,
  });
  const seen = useRef<string>("");
  useEffect(() => {
    const unread = (notes.data ?? []).filter((n) => !n.read);
    const sig = unread.map((n) => n.id).join(",");
    if (sig && sig !== seen.current) {
      const fresh = unread[0];
      if (fresh && seen.current !== "") toast(fresh.title, { description: fresh.body });
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && fresh && seen.current !== "") {
        new Notification(fresh.title, { body: fresh.body });
      }
    }
    seen.current = sig;
  }, [notes.data]);

  const links = [
    { to: "/browse", label: "Order" },
    { to: "/history", label: "Orders" },
    ...(roles.has("STAFF") || roles.has("CANTEEN_ADMIN") || roles.has("SUPER_ADMIN") || roles.has("INSTITUTION_ADMIN")
      ? [{ to: "/staff", label: "Staff" }]
      : []),
    ...(roles.has("CANTEEN_ADMIN") || roles.has("SUPER_ADMIN") ? [{ to: "/admin", label: "Menu admin" }] : []),
    ...(roles.has("INSTITUTION_ADMIN") || roles.has("SUPER_ADMIN") ? [{ to: "/institution", label: "Campus" }] : []),
    ...(roles.has("SUPER_ADMIN") ? [{ to: "/platform", label: "Platform" }] : []),
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            Canteen<span className="text-chili">X</span>
          </Link>
          {title ? <p className="hidden truncate text-sm text-muted sm:block">{title}</p> : null}
          <nav className="ml-auto flex min-w-0 items-center gap-1">
            {user
              ? links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-foam"
                  >
                    {link.label}
                  </Link>
                ))
              : null}
            <div className="relative shrink-0">
              <button
                type="button"
                className="relative grid size-11 place-items-center rounded-full hover:bg-foam"
                aria-label="Notifications"
                aria-expanded={notesOpen}
                onClick={() => {
                  setNotesOpen((open) => !open);
                  if (typeof Notification !== "undefined" && Notification.permission === "default") {
                    void Notification.requestPermission();
                  }
                  void markNotificationsRead().then(() => notes.refetch());
                }}
              >
                <Bell className="size-5" />
                {(notes.data ?? []).some((n) => !n.read) ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-chili" />
                ) : null}
              </button>
              {notesOpen ? (
                <div className="absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-foam p-3 shadow-sm">
                  <p className="px-2 text-sm font-semibold">Updates</p>
                  <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
                    {(notes.data ?? []).length === 0 ? (
                      <li className="px-2 py-3 text-sm text-muted">No updates yet. Order status lands here.</li>
                    ) : (
                      (notes.data ?? []).map((note) => (
                        <li key={note.id}>
                          {note.orderId ? (
                            <Link
                              to="/track/$orderId"
                              params={{ orderId: note.orderId }}
                              className="block rounded-2xl px-2 py-2 hover:bg-cream"
                              onClick={() => setNotesOpen(false)}
                            >
                              <p className="text-sm font-semibold">{note.title}</p>
                              <p className="text-xs text-muted">{note.body}</p>
                            </Link>
                          ) : (
                            <div className="px-2 py-2">
                              <p className="text-sm font-semibold">{note.title}</p>
                              <p className="text-xs text-muted">{note.body}</p>
                            </div>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center">
              {isPending ? <span className="size-8 animate-pulse rounded-full bg-line" /> : user ? <UserButton /> : (
                <Link to="/login" className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-foam">Sign in</Link>
              )}
            </div>
          </nav>
        </div>
      </header>
      {back ? (
        <div className="no-print mx-auto max-w-6xl px-4 pt-4">
          <a href={back.href} className="inline-flex items-center gap-1 text-sm font-medium text-muted">
            <ChevronLeft className="size-4" /> {back.label}
          </a>
        </div>
      ) : null}
      <div className="mx-auto max-w-6xl px-4 py-5">{children}</div>
    </div>
  );
}

export function DemoBanner() {
  return (
    <p className="rounded-2xl border border-line bg-foam px-4 py-3 text-sm text-muted">
      Demo data. Payments run in demo mode unless Razorpay keys are configured — no card details are stored.
    </p>
  );
}
