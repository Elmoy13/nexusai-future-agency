import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AgencyMembership {
  agency_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  agency: { id: string; name: string };
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: AgencyMembership[];
  currentAgencyId: string | null;
  setCurrentAgencyId: (id: string) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const AGENCY_KEY = "nexus.currentAgencyId";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<AgencyMembership[]>([]);
  const [currentAgencyId, setCurrentAgencyIdState] = useState<string | null>(
    () => localStorage.getItem(AGENCY_KEY)
  );
  const [loading, setLoading] = useState(true);

  const setCurrentAgencyId = (id: string) => {
    localStorage.setItem(AGENCY_KEY, id);
    setCurrentAgencyIdState(id);
  };

  const loadUserData = async (userId: string) => {
    const [{ data: prof }, { data: mems }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase
        .from("agency_members")
        .select("agency_id, role, agency:agencies(id, name)")
        .eq("user_id", userId),
    ]);

    setProfile((prof as Profile) ?? null);
    const list = (mems as unknown as AgencyMembership[]) ?? [];
    setMemberships(list);

    if (list.length > 0) {
      const stored = localStorage.getItem(AGENCY_KEY);
      const valid = stored && list.some((m) => m.agency_id === stored);
      if (!valid) {
        setCurrentAgencyId(list[0].agency_id);
      } else {
        setCurrentAgencyIdState(stored);
      }
    }
  };

  useEffect(() => {
    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid deadlock
        setTimeout(() => loadUserData(newSession.user.id), 0);
      } else {
        setProfile(null);
        setMemberships([]);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(AGENCY_KEY);
    setProfile(null);
    setMemberships([]);
    setCurrentAgencyIdState(null);
  };

  const refresh = async () => {
    if (user) await loadUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        memberships,
        currentAgencyId,
        setCurrentAgencyId,
        loading,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
