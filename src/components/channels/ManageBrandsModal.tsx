import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Tag, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useChannelBrands, useUpdateChannelBrands } from "@/hooks/useChannelBrands";
import type { Channel, ChannelBrandAssignment } from "@/types/channels";
import { cn } from "@/lib/utils";

interface BrandOption {
  id: string;
  name: string;
}

interface ManageBrandsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  brands: BrandOption[];
}

interface LocalAssignment {
  brand_id: string;
  enabled: boolean;
  trigger_keywords: string[];
  is_default: boolean;
}

export function ManageBrandsModal({
  open,
  onOpenChange,
  channel,
  brands,
}: ManageBrandsModalProps) {
  const { data: serverAssignments, isLoading: loadingAssignments } = useChannelBrands(
    open && channel ? channel.id : null,
  );
  const updateMutation = useUpdateChannelBrands();

  const [localAssignments, setLocalAssignments] = useState<LocalAssignment[]>([]);
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync from server when loaded
  useEffect(() => {
    if (!open) return;
    const assignmentMap = new Map(
      (serverAssignments ?? []).map((a) => [a.brand_id, a]),
    );
    setLocalAssignments(
      brands.map((b, idx) => {
        const existing = assignmentMap.get(b.id);
        return {
          brand_id: b.id,
          enabled: !!existing,
          trigger_keywords: existing?.trigger_keywords ?? [],
          is_default: existing?.is_default ?? (idx === 0 && !assignmentMap.size),
        };
      }),
    );
    setKeywordInputs({});
    setValidationError(null);
  }, [open, serverAssignments, brands]);

  const enabledCount = localAssignments.filter((a) => a.enabled).length;

  const toggleBrand = useCallback((brandId: string) => {
    setLocalAssignments((prev) => {
      const next = prev.map((a) =>
        a.brand_id === brandId
          ? { ...a, enabled: !a.enabled, trigger_keywords: !a.enabled ? a.trigger_keywords : [] }
          : a,
      );
      // Ensure exactly one default among enabled
      const enabled = next.filter((a) => a.enabled);
      const hasDefault = enabled.some((a) => a.is_default);
      if (!hasDefault && enabled.length > 0) {
        const first = enabled[0];
        return next.map((a) =>
          a.brand_id === first.brand_id ? { ...a, is_default: true } : { ...a, is_default: false },
        );
      }
      if (!next.find((a) => a.brand_id === brandId)?.enabled) {
        // if removed default, reassign
        const enabled2 = next.filter((a) => a.enabled);
        if (enabled2.length > 0 && !enabled2.some((a) => a.is_default)) {
          return next.map((a) =>
            a.brand_id === enabled2[0].brand_id ? { ...a, is_default: true } : a,
          );
        }
      }
      return next;
    });
    setValidationError(null);
  }, []);

  const setDefault = useCallback((brandId: string) => {
    setLocalAssignments((prev) =>
      prev.map((a) => ({ ...a, is_default: a.brand_id === brandId })),
    );
  }, []);

  const addKeyword = useCallback((brandId: string, raw: string) => {
    const keywords = raw
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);
    if (keywords.length === 0) return;
    setLocalAssignments((prev) =>
      prev.map((a) =>
        a.brand_id === brandId
          ? { ...a, trigger_keywords: [...new Set([...a.trigger_keywords, ...keywords])] }
          : a,
      ),
    );
    setKeywordInputs((prev) => ({ ...prev, [brandId]: "" }));
  }, []);

  const removeKeyword = useCallback((brandId: string, keyword: string) => {
    setLocalAssignments((prev) =>
      prev.map((a) =>
        a.brand_id === brandId
          ? { ...a, trigger_keywords: a.trigger_keywords.filter((k) => k !== keyword) }
          : a,
      ),
    );
  }, []);

  const handleKeywordKeyDown = (brandId: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const val = keywordInputs[brandId] ?? "";
      if (val.trim()) addKeyword(brandId, val);
    }
  };

  const handleSave = () => {
    const enabled = localAssignments.filter((a) => a.enabled);
    if (enabled.length === 0) {
      setValidationError("Selecciona al menos una marca");
      return;
    }
    if (!channel) return;

    updateMutation.mutate(
      {
        channelId: channel.id,
        assignments: enabled.map((a) => ({
          brand_id: a.brand_id,
          trigger_keywords: a.trigger_keywords,
          is_default: a.is_default,
        })),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const matchedPlatformName =
    channel?.platform === "facebook"
      ? "Facebook Messenger"
      : channel?.platform === "instagram"
        ? "Instagram DMs"
        : channel?.platform ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar marcas</DialogTitle>
          {channel && (
            <p className="text-xs text-muted-foreground mt-1">
              {channel.page_name} · {matchedPlatformName}
            </p>
          )}
        </DialogHeader>

        {brands.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Primero crea una marca para poder asignarla a este canal.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Ir a Marcas →
            </Link>
          </div>
        ) : loadingAssignments ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Selecciona qué marcas responden en esta página. Si eliges varias, usa keywords para
              que la IA sepa cuál marca debe responder.
            </p>

            <div className="flex-1 overflow-auto space-y-3 py-2">
              {localAssignments.map((assignment) => {
                const brand = brands.find((b) => b.id === assignment.brand_id);
                if (!brand) return null;
                return (
                  <div
                    key={assignment.brand_id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      assignment.enabled
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/20 bg-transparent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={assignment.enabled}
                        onCheckedChange={() => toggleBrand(assignment.brand_id)}
                      />
                      <span className="text-sm font-medium text-foreground flex-1">
                        {brand.name}
                      </span>
                      {assignment.enabled && assignment.is_default && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-primary/25">
                          Default
                        </Badge>
                      )}
                      {assignment.enabled && !assignment.is_default && enabledCount > 1 && (
                        <button
                          onClick={() => setDefault(assignment.brand_id)}
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                        >
                          Hacer default
                        </button>
                      )}
                    </div>

                    {assignment.enabled && (
                      <div className="mt-3 pl-7 space-y-2">
                        <label className="text-[11px] text-muted-foreground font-medium">
                          Keywords (opcional):
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {assignment.trigger_keywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="secondary"
                              className="text-[11px] gap-1 pr-1"
                            >
                              {kw}
                              <button
                                onClick={() => removeKeyword(assignment.brand_id, kw)}
                                className="ml-0.5 hover:text-destructive transition-colors bg-transparent border-none cursor-pointer p-0"
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Input
                          value={keywordInputs[assignment.brand_id] ?? ""}
                          onChange={(e) =>
                            setKeywordInputs((prev) => ({
                              ...prev,
                              [assignment.brand_id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => handleKeywordKeyDown(assignment.brand_id, e)}
                          onBlur={() => {
                            const val = keywordInputs[assignment.brand_id] ?? "";
                            if (val.trim()) addKeyword(assignment.brand_id, val);
                          }}
                          placeholder="Escribe keyword y presiona Enter"
                          className="h-8 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                          <Tag size={10} />
                          La IA responderá como esta marca si el mensaje contiene alguna keyword
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {enabledCount > 1 && (
              <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                <Info size={14} className="shrink-0 mt-0.5" />
                La marca "Default" responde cuando ningún keyword coincide con el mensaje.
              </div>
            )}

            {validationError && (
              <p className="text-xs text-destructive text-center">{validationError}</p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
