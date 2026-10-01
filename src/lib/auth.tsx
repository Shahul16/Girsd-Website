"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, getAccessToken, isSupabaseConfigured } from "@/lib/supabase";

export type Ticket = {
  orderId: string;
  eventSlug: string;
  eventTitle: string;
  tierName: string;
  quantity: number;
  paid: number;
  date: string;
};

export type Enrolment = {
  orderId: string;
  courseSlug: string;
  courseTitle: string;
  paid: number;
  date: string;
};

export type Membership = {
  tierId: string;
  tierName: string;
  price: number;
  since: string;
  renewsAt: string;
  status: string;
  membershipId?: string;
};

export type User = {
  name: string;
  email: string;
  membership: Membership | null;
  membershipStatus?: string; // "ACTIVE_MEMBER" | "UNDER_REVIEW" | "VERIFICATION_REQUIRED" | "PAYMENT_COMPLETED"
  membershipApplicationId?: string;
  tickets: Ticket[];
  enrolments: Enrolment[];
};

export type AuthResult = { error?: string; needsConfirmation?: boolean };

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInWithProvider: (provider: "google" | "azure" | "apple", next?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  cancelMembership: () => Promise<AuthResult>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED =
  "Sign-in is not available yet — the site owner has not connected the authentication service (Supabase).";

type OrderRow = {
  id: string;
  kind: "ticket" | "course" | "membership";
  title: string;
  slug: string | null;
  tier: string | null;
  quantity: number;
  amount: number; // pence
  created_at: string;
  cancelled_at: string | null;
};

function deriveFromOrders(rows: OrderRow[]): Pick<User, "membership" | "tickets" | "enrolments"> {
  const tickets: Ticket[] = [];
  const enrolments: Enrolment[] = [];
  let membership: Membership | null = null;

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  for (const r of rows) {
    if (r.kind === "ticket") {
      tickets.push({
        orderId: r.id,
        eventSlug: r.slug ?? "",
        eventTitle: r.title,
        tierName: r.tier ?? "",
        quantity: r.quantity,
        paid: Math.round(r.amount / 100),
        date: r.created_at,
      });
    } else if (r.kind === "course") {
      enrolments.push({
        orderId: r.id,
        courseSlug: r.slug ?? "",
        courseTitle: r.title,
        paid: Math.round(r.amount / 100),
        date: r.created_at,
      });
    } else if (
      r.kind === "membership" &&
      !r.cancelled_at &&
      new Date(r.created_at) > yearAgo &&
      !membership
    ) {
      const renews = new Date(r.created_at);
      renews.setFullYear(renews.getFullYear() + 1);
      // Financial record only — core rule: payment does NOT grant active member benefits
      membership = {
        tierId: r.slug ?? "",
        tierName: r.tier ?? r.title,
        price: Math.round(r.amount / 100),
        since: r.created_at,
        renewsAt: renews.toISOString(),
        status: "PAYMENT_COMPLETED",
      };
    }
  }
  return { membership, tickets, enrolments };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const emailRef = useRef<string | null>(null);

  const loadOrders = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: sessionData } = await sb.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    // 1. Load orders (tickets & courses)
    const { data: ordersData, error: ordersError } = await sb
      .from("orders")
      .select("id, kind, title, slug, tier, quantity, amount, created_at, cancelled_at")
      .order("created_at", { ascending: false });

    // 2. Load membership application verification status
    let appStatus: string | undefined = undefined;
    let appId: string | undefined = undefined;
    let approvedMembership: Membership | null = null;

    try {
      const { data: appData } = await sb
        .from("membership_applications")
        .select("id, status, tier_id, tier_name, annual_fee, membership_id, valid_from, valid_until, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appData) {
        appStatus = appData.status;
        appId = appData.id;
        const isApproved =
          (appData.status === "ACTIVE_MEMBER" || appData.status === "APPROVED" || appData.status === "Active") &&
          (!appData.valid_until || new Date(appData.valid_until) > new Date());

        if (isApproved) {
          const renews = appData.valid_until || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
          approvedMembership = {
            tierId: appData.tier_id,
            tierName: appData.tier_name,
            price: appData.annual_fee || 49,
            since: appData.valid_from || appData.created_at,
            renewsAt: renews,
            status: "ACTIVE_MEMBER",
            membershipId: appData.membership_id || appId,
          };
        }
      }
    } catch {
      /* Table might not exist yet in local development */
    }

    if (!ordersError && ordersData) {
      const derived = deriveFromOrders(ordersData as OrderRow[]);
      // Active membership is strictly gated: only explicit board approval grants active membership benefits.
      const finalMembership = approvedMembership !== null ? approvedMembership : null;
      const hasPaidMembership = Boolean(derived.membership);
      const effectiveStatus =
        appStatus ||
        (approvedMembership
          ? "ACTIVE_MEMBER"
          : hasPaidMembership
          ? "PAYMENT_COMPLETED"
          : undefined);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              tickets: derived.tickets,
              enrolments: derived.enrolments,
              membership: finalMembership,
              membershipStatus: effectiveStatus,
              membershipApplicationId: appId,
            }
          : prev
      );
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }

    let cancelled = false;

    const applySession = (sessionUser: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (cancelled) return;
      if (!sessionUser?.email) {
        emailRef.current = null;
        setUser(null);
        return;
      }
      if (emailRef.current === sessionUser.email) return; // already applied
      emailRef.current = sessionUser.email;
      const meta = sessionUser.user_metadata ?? {};
      const name =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        sessionUser.email.split("@")[0].replace(/[._]/g, " ");
      setUser({
        name,
        email: sessionUser.email,
        membership: null,
        tickets: [],
        enrolments: [],
      });
      void loadOrders();
    };

    sb.auth.getSession().then(({ data }) => {
      applySession(data.session?.user ?? null);
      if (!cancelled) setReady(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadOrders]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb) return { error: NOT_CONFIGURED };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: friendly(error.message) };
    return {};
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const sb = getSupabase();
      if (!sb) return { error: NOT_CONFIGURED };
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: friendly(error.message) };
      if (!data.session) return { needsConfirmation: true };
      return {};
    },
    []
  );

  const signInWithProvider = useCallback(
    async (provider: "google" | "azure" | "apple", next = "/dashboard"): Promise<AuthResult> => {
      const sb = getSupabase();
      if (!sb) return { error: NOT_CONFIGURED };
      const redirectTo = `${window.location.origin}${next.startsWith("/") ? next : "/dashboard"}`;
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(provider === "azure" ? { scopes: "openid profile email" } : {}),
        },
      });
      if (error) return { error: friendly(error.message) };
      return {}; // browser redirects away
    },
    []
  );

  const logout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    emailRef.current = null;
    setUser(null);
  }, []);

  const cancelMembership = useCallback(async (): Promise<AuthResult> => {
    const token = await getAccessToken();
    if (!token) return { error: NOT_CONFIGURED };
    const res = await fetch("/api/membership/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.error ?? "Could not cancel membership. Please contact us." };
    }
    setUser((prev) => (prev ? { ...prev, membership: null } : prev));
    return {};
  }, []);

  const refresh = useCallback(async () => {
    await loadOrders();
  }, [loadOrders]);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        configured: isSupabaseConfigured,
        login,
        register,
        signInWithProvider,
        logout,
        cancelMembership,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("already registered")) return "An account with this email already exists — please log in.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "This sign-in provider is not enabled yet. Please use email and password.";
  if (m.includes("rate limit")) return "Too many attempts — please wait a minute and try again.";
  return message;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
