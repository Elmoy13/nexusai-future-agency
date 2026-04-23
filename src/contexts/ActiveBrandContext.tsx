import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";

export interface Brand {
  id: string;
  name: string;
}

interface ActiveBrandContextValue {
  brand: Brand | null;
  brands: Brand[];
  setBrand: (brandId: string) => void;
  isLoading: boolean;
}

const ActiveBrandContext = createContext<ActiveBrandContextValue | undefined>(undefined);

const STORAGE_KEY = "active_brand_id";

export const ActiveBrandProvider = ({ children }: { children: ReactNode }) => {
  const { currentAgencyId } = useAgency();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = useCallback(async (agencyId: string) => {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .eq("agency_id", agencyId)
      .order("name");

    if (error) {
      console.error("[ActiveBrandContext] fetch error:", error);
      return [];
    }
    return (data ?? []) as Brand[];
  }, []);

  useEffect(() => {
    if (!currentAgencyId) {
      setBrands([]);
      setSelectedId(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchBrands(currentAgencyId).then((list) => {
      if (cancelled) return;
      setBrands(list);

      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = stored && list.some((b) => b.id === stored);
      const next = valid ? stored! : list[0]?.id ?? null;

      if (next) localStorage.setItem(STORAGE_KEY, next);
      setSelectedId(next);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [currentAgencyId, fetchBrands]);

  const setBrand = useCallback(
    (brandId: string) => {
      if (!brands.some((b) => b.id === brandId)) return;
      localStorage.setItem(STORAGE_KEY, brandId);
      setSelectedId(brandId);
    },
    [brands],
  );

  const brand = brands.find((b) => b.id === selectedId) ?? null;

  return (
    <ActiveBrandContext.Provider value={{ brand, brands, setBrand, isLoading }}>
      {children}
    </ActiveBrandContext.Provider>
  );
};

export const useActiveBrand = () => {
  const ctx = useContext(ActiveBrandContext);
  if (!ctx) throw new Error("useActiveBrand must be used inside <ActiveBrandProvider>");
  return ctx;
};
