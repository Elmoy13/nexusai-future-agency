import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  type EditorState,
  persistEditorStateBeacon,
  updateEditorState,
} from "@/lib/briefService";

export type PersistStatus = "idle" | "saving" | "saved" | "error";

export interface UseEditorPersistenceResult {
  status: PersistStatus;
  lastSavedAt: Date | null;
  /** Encola un guardado debounced (2s). El estado se reemplaza completo en cada call. */
  persist: (state: EditorState) => void;
  /** Fuerza el guardado inmediato del último estado encolado. */
  flush: () => Promise<void>;
  /** Reintenta el último guardado fallido. */
  retry: () => Promise<void>;
  /** True una vez que la primera escritura real (post-hidratación) ocurrió. */
  hasPersisted: boolean;
}

/**
 * Auto-save con debounce 2s para `brand_briefs.editor_state`.
 *
 * - `persist(state)`: encola — debounced 2s. Cada cambio reemplaza el estado completo.
 * - `flush()`: dispara el guardado pendiente de inmediato.
 * - `beforeunload`: usa `fetch` con `keepalive` (vía persistEditorStateBeacon)
 *   como fallback síncrono.
 *
 * Si `briefId` es `null` (modo legacy/demo), el hook es no-op.
 */
export function useEditorPersistence(
  briefId: string | null,
): UseEditorPersistenceResult {
  const [status, setStatus] = useState<PersistStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasPersisted, setHasPersisted] = useState(false);

  // Última snapshot encolada — se persiste en flush/beforeunload.
  const pendingRef = useRef<EditorState | null>(null);
  const briefIdRef = useRef(briefId);
  briefIdRef.current = briefId;

  const doSave = useCallback(async (state: EditorState) => {
    const id = briefIdRef.current;
    if (!id) return;
    setStatus("saving");
    try {
      await updateEditorState(id, state);
      setLastSavedAt(new Date());
      setStatus("saved");
      setHasPersisted(true);
    } catch (err) {
      console.error("[useEditorPersistence] save failed:", err);
      setStatus("error");
    }
  }, []);

  const debouncedSave = useDebouncedCallback(
    (state: EditorState) => {
      void doSave(state);
    },
    2000,
    { maxWait: 8000 },
  );

  const persist = useCallback(
    (state: EditorState) => {
      if (!briefIdRef.current) return;
      pendingRef.current = state;
      setStatus("saving"); // mostramos "guardando..." mientras el debounce drena
      debouncedSave(state);
    },
    [debouncedSave],
  );

  const flush = useCallback(async () => {
    debouncedSave.cancel();
    const pending = pendingRef.current;
    if (pending) {
      await doSave(pending);
    }
  }, [debouncedSave, doSave]);

  const retry = useCallback(async () => {
    if (pendingRef.current) await doSave(pendingRef.current);
  }, [doSave]);

  // beforeunload: intento síncrono con fetch keepalive vía persistEditorStateBeacon.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const id = briefIdRef.current;
      const pending = pendingRef.current;
      if (!id || !pending) return;
      // 1) cancelar debounce y enviar con keepalive
      debouncedSave.cancel();
      const ok = persistEditorStateBeacon(id, pending);
      if (!ok) {
        // 2) si el envío no se pudo encolar, mostramos prompt nativo
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [debouncedSave]);

  // Cleanup al desmontar: flush async best-effort
  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  return { status, lastSavedAt, persist, flush, retry, hasPersisted };
}
