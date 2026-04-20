import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AgencyRole = "owner" | "admin" | "editor" | "viewer";

export interface AgencyMembershipLite {
  id: string;
  name: string;
  role: AgencyRole;
}

interface AgencyContextValue {
  currentAgencyId: string | null;
  currentAgencyName: string | null;
  currentAgencyRole: AgencyRole | null;
  userAgencies: AgencyMembershipLite[];
  isLoading: boolean;
  switchAgency: (agencyId: string) => void;
  refreshAgencies: () => Promise<void>;
}

const AgencyContext = createContext<AgencyContextValue | undefined>(undefined);

const STORAGE_KEY = "current_agency_id";

export const AgencyProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [userAgencies, setUserAgencies] = useState<AgencyMembershipLite[]>([]);
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgencies = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("agency_members")
      .select("role, agencies:agency_id (id, name)")
      .eq("user_id", uid);

    if (error) {
      console.error("[AgencyContext] fetch error:", error);
      return [];
    }

    const list: AgencyMembershipLite[] = ((data ?? []) as any[])
      .map((row) => ({
        id: row.agencies?.id,
        name: row.agencies?.name,
        role: row.role as AgencyRole,
      }))
      .filter((a) => a.id && a.name);

    return list;
  }, []);

  const hydrate = useCallback(async () => {
    if (!user) {
      setUserAgencies([]);
      setCurrentAgencyId(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const list = await fetchAgencies(user.id);
    setUserAgencies(list);

    if (list.length === 0) {
      setCurrentAgencyId(null);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = stored && list.some((a) => a.id === stored);
      const next = valid ? stored! : list[0].id;
      localStorage.setItem(STORAGE_KEY, next);
      setCurrentAgencyId(next);
    }
    setIsLoading(false);
  }, [user, fetchAgencies]);

  useEffect(() => {
    if (authLoading) return;
    hydrate();
  }, [authLoading, hydrate]);

  const switchAgency = useCallback(
    (agencyId: string) => {
      const valid = userAgencies.some((a) => a.id === agencyId);
      if (!valid) {
        console.warn("[AgencyContext] switchAgency: not a member of", agencyId);
        return;
      }
      localStorage.setItem(STORAGE_KEY, agencyId);
      setCurrentAgencyId(agencyId);
    },
    [userAgencies]
  );

  const refreshAgencies = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const current = userAgencies.find((a) => a.id === currentAgencyId) ?? null;

  return (
    <AgencyContext.Provider
      value={{
        currentAgencyId,
        currentAgencyName: current?.name ?? null,
        currentAgencyRole: current?.role ?? null,
        userAgencies,
        isLoading,
        switchAgency,
        refreshAgencies,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const ctx = useContext(AgencyContext);
  if (!ctx) throw new Error("useAgency must be used inside <AgencyProvider>");
  return ctx;
};
