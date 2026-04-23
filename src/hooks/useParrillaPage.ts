import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "use-debounce";
import { useAgency } from "@/contexts/AgencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { createDraft, getDraft, patchDraft, deleteDraft, type DraftPatch } from "@/lib/draftService";
import { approvePost, rejectPost, approveAllPosts, approveAndGenerateImage, generateAllApprovedImages } from "@/lib/postService";
import { generateCopyOnly, generateFull } from "@/lib/generationService";
import type { GenerationRequest } from "@/lib/generationService";
import { uploadBrandLogo, base64ToBlob } from "@/lib/brandStorage";
import { listProducts, type BrandProduct } from "@/lib/productService";
import { apiCall } from "@/lib/apiClient";
import type { Platform, PostStatus, ViewMode, FormatOption, PostCard, BrandProfile, SaveStatus, PostImageStatus } from "@/types/parrilla";
import { ALL_FORMATS, DEFAULT_BRAND } from "@/types/parrilla";
import { toast } from "@/hooks/use-toast";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { TikTokIcon } from "@/components/parrilla/PlatformIcon";

/* ──────────────────────────────────────────────────────────────
   useParrillaPage — owns ALL state, effects, and handlers
   for the Parrilla page. Parrilla.tsx becomes a pure render shell.
   ────────────────────────────────────────────────────────────── */

export function useParrillaPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();
  const { user } = useAuth();

  const isNewParrilla = id === "nueva" || !id;
  const queryDraftId = searchParams.get("draft_id");
  const queryBrandId = searchParams.get("brand_id");
  const candidateJobId = !isNewParrilla && !queryDraftId ? id ?? null : null;
  const [viewJobId, setViewJobId] = useState<string | null>(candidateJobId);
  const [isLoadingJob, setIsLoadingJob] = useState<boolean>(!!candidateJobId);

  // ── Grid / view state ──
  const [activePlatform, setActivePlatform] = useState<string>("instagram");
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isClientView, setIsClientView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [generationMode, setGenerationMode] = useState<"copy-first" | "full">("copy-first");

  // ── Draft state ──
  const [draftId, setDraftId] = useState<string | null>(queryDraftId);
  const [brandId, setBrandId] = useState<string | null>(queryBrandId);
  const [draftHydrated, setDraftHydrated] = useState<boolean>(!isNewParrilla);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [briefInfo, setBriefInfo] = useState<{ id: string; title: string } | null>(null);
  const skipNextSaveRef = useRef<boolean>(true);

  // ── Logo / assets ──
  const [currentLogoB64, setCurrentLogoB64] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [brandAssetBlobs, setBrandAssetBlobs] = useState<Blob[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [brandProducts, setBrandProducts] = useState<BrandProduct[] | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // ── Config ──
  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false, twitter: false });
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["instagram_feed", "tiktok_video"]));
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");
  const [optionsPerPost, setOptionsPerPost] = useState(2);

  const [generatingStatus, setGeneratingStatus] = useState("");
  const [brand, setBrand] = useState<BrandProfile>(DEFAULT_BRAND);

  // ── Chat state (real AI) ──
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**.\n\n📸 **Sube tu logo** y **fotos de tu producto** en el panel de Brand Assets para que pueda analizar tu marca con IA visual. 👈\n\nDespués hablamos sobre tu campaña. 🚀" }
  ]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [brandVision, setBrandVision] = useState<any>(null);
  const [productVision, setProductVision] = useState<any>(null);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [brandName, setBrandName] = useState<string>("");
  const [editingPost, setEditingPost] = useState<PostCard | null>(null);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const parrillaGridRef = useRef<HTMLDivElement>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandDetected, setBrandDetected] = useState(false);
  const [includeLogoInImage, setIncludeLogoInImage] = useState(false);
  const [includeTextInImage, setIncludeTextInImage] = useState(false);
  const [language, setLanguage] = useState<"auto" | "es" | "en">("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<"es" | "en" | null>(null);

  // ── Derived / computed ──
  const availableFormats = useMemo(() => {
    return ALL_FORMATS.filter(f => platforms[f.platform as keyof typeof platforms]);
  }, [platforms]);

  useEffect(() => {
    setSelectedFormats(prev => {
      const newSet = new Set<string>();
      const activePlatformKeys = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
      prev.forEach(fId => {
        const fmt = ALL_FORMATS.find(f => f.id === fId);
        if (fmt && platforms[fmt.platform as keyof typeof platforms]) newSet.add(fId);
      });
      activePlatformKeys.forEach(pk => {
        const platformFormats = ALL_FORMATS.filter(f => f.platform === pk);
        const hasAny = platformFormats.some(f => newSet.has(f.id));
        if (!hasAny && platformFormats.length > 0) newSet.add(platformFormats[0].id);
      });
      return newSet;
    });
  }, [platforms]);

  const getFrequencyCount = (f: string) => ({ "3-week": 3, "5-week": 5, "daily": 7 }[f] || 3);
  const totalPosts = selectedFormats.size * getFrequencyCount(frequency) * optionsPerPost;

  // Load Google Font dynamically
  useEffect(() => {
    const fontName = brand.font_family.replace(/ /g, "+");
    const linkId = "dynamic-brand-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700;900&display=swap`;
  }, [brand.font_family]);

  // ═══════════ Draft hydration & auto-save (Figma-style) ═══════════

  useEffect(() => {
    if (!isNewParrilla) return;
    if (!currentAgencyId || !user) return;
    if (draftHydrated) return;

    let cancelled = false;
    (async () => {
      try {
        if (queryDraftId) {
          const d = await getDraft(queryDraftId);
          if (cancelled) return;
          if (!d) {
            toast({ title: "Borrador no encontrado", variant: "destructive" });
            navigate("/dashboard");
            return;
          }
          setDraftId(d.id);
          setBrandId(d.brand_id);
          const cfg = (d.config as any) || {};
          if (cfg.brand) setBrand({ ...DEFAULT_BRAND, ...cfg.brand });
          if (cfg.brandName) setBrandName(cfg.brandName);
          if (cfg.brandVision) { setBrandVision(cfg.brandVision); setBrandDetected(true); }
          if (cfg.productVision) setProductVision(cfg.productVision);
          if (cfg.platforms) setPlatforms(cfg.platforms);
          if (Array.isArray(cfg.selectedFormats)) setSelectedFormats(new Set(cfg.selectedFormats));
          if (cfg.frequency) setFrequency(cfg.frequency);
          if (cfg.objective) setObjective(cfg.objective);
          if (typeof cfg.optionsPerPost === "number") setOptionsPerPost(cfg.optionsPerPost);
          if (typeof cfg.includeLogoInImage === "boolean") setIncludeLogoInImage(cfg.includeLogoInImage);
          if (typeof cfg.includeTextInImage === "boolean") setIncludeTextInImage(cfg.includeTextInImage);
          if (cfg.language) setLanguage(cfg.language);
          if (cfg.logoUrl) { setCurrentLogoUrl(cfg.logoUrl); setBrandAssets([cfg.logoUrl]); }
          if (Array.isArray(d.chat_messages) && d.chat_messages.length > 0) setChatMessages(d.chat_messages as any);
          if (Array.isArray(d.selected_product_ids) && d.selected_product_ids.length > 0) {
            setSelectedProductIds(d.selected_product_ids);
          }
          if (d.title) setDraftTitle(d.title);
          if (d.brief_id) {
            const { data: briefRow } = await supabase
              .from("brand_briefs")
              .select("id, title")
              .eq("id", d.brief_id)
              .maybeSingle();
            if (briefRow && !cancelled) setBriefInfo(briefRow as any);
          }
          setDraftHydrated(true);
          return;
        }

        if (queryBrandId) {
          const created = await createDraft({
            agencyId: currentAgencyId,
            brandId: queryBrandId,
            userId: user.id,
          });
          if (cancelled) return;
          setDraftId(created.id);
          setBrandId(queryBrandId);
          const { data: brandRow } = await supabase
            .from("brands")
            .select("name, logo_url, primary_color, secondary_color, accent_colors, font_family")
            .eq("id", queryBrandId)
            .maybeSingle();
          if (brandRow && !cancelled) {
            if (brandRow.name) setBrandName(brandRow.name);
            if (brandRow.logo_url) {
              setCurrentLogoUrl(brandRow.logo_url);
              setBrandAssets([brandRow.logo_url]);
              setBrandDetected(true);
            }
            if (brandRow.primary_color) {
              setBrand((prev) => ({
                ...prev,
                primary_color: brandRow.primary_color || prev.primary_color,
                secondary_color: brandRow.secondary_color || prev.secondary_color,
                font_family: brandRow.font_family || prev.font_family,
              }));
            }
          }
          setSearchParams({ draft_id: created.id }, { replace: true });
          setDraftHydrated(true);
          return;
        }

        setDraftHydrated(true);
      } catch (err: any) {
        console.error("[parrilla] hydration error", err);
        toast({ title: "Error cargando borrador", description: err?.message, variant: "destructive" });
        setDraftHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isNewParrilla, currentAgencyId, user, queryDraftId, queryBrandId, draftHydrated, navigate, setSearchParams]);

  // ═══════════ View existing job ═══════════

  useEffect(() => {
    if (!viewJobId) return;
    if (!currentAgencyId) return;
    let cancelled = false;
    (async () => {
      setIsLoadingJob(true);
      try {
        const { data: job, error: jobErr } = await supabase
          .from("generation_jobs")
          .select("id, brand_id, brand_name, campaign_description, language, status, created_at")
          .eq("id", viewJobId)
          .maybeSingle();

        if (cancelled) return;

        if (jobErr || !job) {
          const draft = await getDraft(viewJobId);
          if (cancelled) return;
          if (draft) {
            setViewJobId(null);
            navigate(`/parrilla/nueva?draft_id=${draft.id}`, { replace: true });
            return;
          }
          toast({ title: "Parrilla no encontrada", variant: "destructive" });
          navigate("/dashboard");
          return;
        }

        if (job.brand_id) {
          setBrandId(job.brand_id);
          const { data: brandRow } = await supabase
            .from("brands")
            .select("name, logo_url, primary_color, secondary_color, accent_colors, font_family")
            .eq("id", job.brand_id)
            .maybeSingle();
          if (cancelled) return;
          if (brandRow?.name) setBrandName(brandRow.name);
          else if (job.brand_name) setBrandName(job.brand_name);
          if (brandRow?.logo_url) {
            setCurrentLogoUrl(brandRow.logo_url);
            setBrandAssets([brandRow.logo_url]);
            setBrandDetected(true);
          }
          if (brandRow?.primary_color) {
            setBrand((prev) => ({
              ...prev,
              primary_color: brandRow.primary_color || prev.primary_color,
              secondary_color: brandRow.secondary_color || prev.secondary_color,
              font_family: brandRow.font_family || prev.font_family,
            }));
          }
        } else if (job.brand_name) {
          setBrandName(job.brand_name);
        }

        if (job.campaign_description) {
          const firstLine = job.campaign_description.split("\n")[0]?.trim() || "";
          if (firstLine) setDraftTitle(firstLine.slice(0, 80));
        }
        if (job.language === "es" || job.language === "en") {
          setDetectedLanguage(job.language as "es" | "en");
        }

        const { data: gp, error: gpErr } = await supabase
          .from("generated_posts")
          .select("id, platform, format, headline, body, cta, image_prompt, rendered_image_url, status, index, video_url, video_status, image_status, approval_status, approved_at")
          .eq("job_id", viewJobId)
          .order("index", { ascending: true });

        if (cancelled) return;
        if (gpErr) {
          console.error("[parrilla] load generated_posts failed", gpErr);
          toast({ title: "Error cargando posts", description: gpErr.message, variant: "destructive" });
          return;
        }

        const loaded: PostCard[] = (gp ?? [])
          .filter((sp: any) => sp.status === "success" || sp.status === "error")
          .map((sp: any, idx: number) => ({
            id: sp.id || `post-${viewJobId}-${idx}`,
            platform: (sp.platform || "instagram") as Platform,
            format: sp.format || "instagram_feed",
            status: (sp.approval_status === "approved" && (sp.image_status === "ready" || sp.rendered_image_url) ? "scheduled" : "draft") as PostStatus,
            calendarDay: ((sp.index ?? idx) * 2) + 1,
            image: sp.rendered_image_url || "",
            headline: sp.headline || "",
            body: sp.body || "",
            cta: sp.cta || "",
            imagePrompt: sp.image_prompt || "",
            isRendering: false,
            error: sp.status === "error" ? (sp.error_message || "Error") : null,
            video_url: sp.video_url || undefined,
            video_status: sp.video_status || undefined,
            image_status: (sp.image_status || (sp.rendered_image_url ? "ready" : "pending")) as PostImageStatus,
            approval_status: sp.approval_status || "pending",
            approved_at: sp.approved_at || null,
          }));

        const platformsPresent = new Set(loaded.map((p) => p.platform));
        if (platformsPresent.size > 0) {
          setPlatforms({
            instagram: platformsPresent.has("instagram" as Platform),
            tiktok: platformsPresent.has("tiktok" as Platform),
            linkedin: platformsPresent.has("linkedin" as Platform),
            twitter: platformsPresent.has("twitter" as Platform),
          });
          const first = Array.from(platformsPresent)[0] as string;
          setActivePlatform(first);
        }

        setPosts(loaded);
        setHasGenerated(loaded.length > 0);
      } catch (err: any) {
        console.error("[parrilla] view-job load error", err);
        toast({ title: "Error cargando parrilla", description: err?.message, variant: "destructive" });
      } finally {
        if (!cancelled) setIsLoadingJob(false);
      }
    })();
    return () => { cancelled = true; };
  }, [viewJobId, currentAgencyId, navigate]);

  // ═══════════ Brand products ═══════════

  useEffect(() => {
    if (!brandId) { setBrandProducts(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const list = await listProducts(brandId);
        if (!cancelled) setBrandProducts(list);
      } catch (err) {
        console.error("[parrilla] listProducts failed", err);
        if (!cancelled) setBrandProducts([]);
      }
    })();
    return () => { cancelled = true; };
  }, [brandId]);

  const autoSelectAppliedRef = useRef(false);
  useEffect(() => {
    if (!draftHydrated) return;
    if (autoSelectAppliedRef.current) return;
    if (!brandProducts || brandProducts.length === 0) return;
    if (selectedProductIds.length > 0) {
      autoSelectAppliedRef.current = true;
      return;
    }
    const primary = brandProducts.find((p) => p.is_primary) ?? brandProducts[0];
    if (primary) {
      setSelectedProductIds([primary.id]);
      autoSelectAppliedRef.current = true;
    }
  }, [brandProducts, draftHydrated, selectedProductIds.length]);

  // ═══════════ Auto-save ═══════════

  const draftSnapshotRef = useRef<{ get: () => DraftPatch }>({ get: () => ({}) as DraftPatch });
  draftSnapshotRef.current.get = () => ({
    title: draftTitle || null,
    chat_messages: chatMessages,
    config: {
      brand,
      brandName,
      brandVision,
      productVision,
      platforms,
      selectedFormats: Array.from(selectedFormats),
      frequency,
      objective,
      optionsPerPost,
      includeLogoInImage,
      includeTextInImage,
      language,
      logoUrl: currentLogoUrl,
    } as any,
    selected_product_ids: selectedProductIds,
    last_step: hasGenerated ? "generated" : "configuring",
  });

  const persistDraft = useDebouncedCallback(async () => {
    const id = draftId;
    if (!id) return;
    setSaveStatus("saving");
    try {
      await patchDraft(id, draftSnapshotRef.current.get());
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("[parrilla] auto-save failed", err);
      setSaveStatus("error");
    }
  }, 2000);

  useEffect(() => {
    if (!draftHydrated || !draftId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftHydrated, draftId,
    chatMessages, brand, brandName, brandVision, productVision,
    platforms, selectedFormats, frequency, objective, optionsPerPost,
    includeLogoInImage, includeTextInImage, language, currentLogoUrl, hasGenerated,
    selectedProductIds, draftTitle,
  ]);

  const handleDiscardDraft = useCallback(async () => {
    if (!draftId) { navigate("/dashboard"); return; }
    if (!confirm("¿Descartar este borrador? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDraft(draftId);
      toast({ title: "Borrador descartado" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error al descartar", description: err?.message, variant: "destructive" });
    }
  }, [draftId, navigate]);

  // ═══════════ Chat ═══════════

  const sendChatMessage = useCallback(async (userMessage: string) => {
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newMessages);
    setIsChatThinking(true);
    try {
      const data = await apiCall<{ reply: string }>("/api/v1/chat", {
        method: "POST",
        body: {
          messages: newMessages,
          brand_context: brandVision,
          product_context: productVision,
          brand_colors: brand,
          language,
        },
      });
      setChatMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages([...newMessages, { role: "assistant", content: "⚠️ Error al conectar con el agente. Intenta de nuevo." }]);
    } finally {
      setIsChatThinking(false);
    }
  }, [chatMessages, brandVision, productVision, brand, language]);

  // Intro message when brand + product are both analyzed
  const introSentRef = useRef(false);
  useEffect(() => {
    if (brandVision && productVision && !introSentRef.current) {
      introSentRef.current = true;
      (async () => {
        setIsChatThinking(true);
        try {
          const introMessages = [{ role: "user" as const, content: "Hola, acabo de subir mi logo y una foto de mi producto. Analízalos y preséntate." }];
          const data = await apiCall<{ reply: string }>("/api/v1/chat", {
            method: "POST",
            body: {
              messages: introMessages,
              brand_context: brandVision,
              product_context: productVision,
              brand_colors: brand,
              language,
            },
          });
          setChatMessages([{ role: "assistant", content: data.reply }]);
        } catch {
          setChatMessages([{ role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**. Ya analicé tu marca y producto. Cuéntame sobre tu campaña." }]);
        } finally {
          setIsChatThinking(false);
        }
      })();
    }
  }, [brandVision, productVision, brand]);

  const brandIntroSentRef = useRef(false);
  useEffect(() => {
    if (brandVision && !productVision && !brandIntroSentRef.current && !introSentRef.current) {
      brandIntroSentRef.current = true;
      (async () => {
        setIsChatThinking(true);
        try {
          const introMessages = [{ role: "user" as const, content: "Hola, acabo de subir mi logo. Analízalo y preséntate." }];
          const data = await apiCall<{ reply: string }>("/api/v1/chat", {
            method: "POST",
            body: {
              messages: introMessages,
              brand_context: brandVision,
              product_context: null,
              brand_colors: brand,
              language,
            },
          });
          setChatMessages([{ role: "assistant", content: data.reply }]);
        } catch {
          setChatMessages([{ role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**. Ya analicé tu logo. Sube fotos de tu producto y cuéntame sobre tu campaña." }]);
        } finally {
          setIsChatThinking(false);
        }
      })();
    }
  }, [brandVision, productVision, brand]);

  // ═══════════ Brand analysis ═══════════

  const analyzeBrand = useCallback(async (logoB64: string) => {
    setIsAnalyzingBrand(true);
    setBrandDetected(false);
    try {
      const res = await apiCall<{
        analysis: {
          palette: string[]; primary_color: string; secondary_color?: string;
          accent_colors?: string[]; contrast_color?: string;
          suggested_fonts?: string[]; background_suggestion?: string;
          mood?: string; style?: string; personality?: string[];
          brand_name?: string; detected_typography?: string;
          logo_description?: string; target_audience?: string;
          suggested_scenes?: string[];
        };
        logo_url: string | null;
        persisted: boolean;
      }>("/api/v1/brand/analyze-vision", {
        method: "POST",
        body: { logo_b64: logoB64 },
      });

      const a = res.analysis;
      if (!a?.palette || !a.primary_color) throw new Error("Respuesta incompleta de la API");

      const newBrand: BrandProfile = {
        primary_color: a.primary_color,
        secondary_color: a.secondary_color || a.palette[1] || "#333333",
        accent_color: a.accent_colors?.[0] || a.palette[2] || "#666666",
        palette: a.palette,
        contrast_color: a.contrast_color || "#FFFFFF",
        font_family: a.suggested_fonts?.[0] || "Montserrat",
        suggested_fonts: a.suggested_fonts || ["Montserrat", "Poppins", "Inter"],
        background_suggestion: a.background_suggestion || "dark",
      };
      setBrand(newBrand);
      setBrandDetected(true);
      setIsAnalyzingBrand(false);

      if (res.logo_url) {
        setCurrentLogoUrl(res.logo_url);
      }

      setBrandVision(a);
      if (a.brand_name && !brandName) {
        setBrandName(a.brand_name);
      }

      toast({ title: "✨ Marca analizada con IA visual", description: "Colores, tipografía y personalidad detectados." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Error analyzing brand:", error);
      setIsAnalyzingBrand(false);
      setBrandDetected(false);
      toast({ title: "⚠️ No se pudo analizar el logo", description: "Configura los colores manualmente o intenta de nuevo.", variant: "destructive" });
    }
  }, [brandName, id]);

  const analyzeProduct = useCallback(async (productB64: string) => {
    setIsAnalyzingProduct(true);
    try {
      const data = await apiCall<{ product_description?: string; [k: string]: unknown }>("/api/v1/product/analyze", {
        method: "POST",
        body: { product_b64: productB64 },
      });
      setProductVision(data);
      toast({ title: "🧠 Producto analizado", description: data.product_description || "Análisis visual completado." });
    } catch (err) {
      console.error("Error analyzing product:", err);
      toast({ title: "⚠️ No se pudo analizar el producto", variant: "destructive" });
    } finally {
      setIsAnalyzingProduct(false);
    }
  }, []);

  // ═══════════ File uploads ═══════════

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Máximo 10MB.", variant: "destructive" });
      return;
    }
    e.target.value = "";
    const previewUrl = URL.createObjectURL(file);
    setBrandAssets((prev) => [...prev, previewUrl]);
    setBrandAssetBlobs((prev) => [...prev, file]);
    toast({ title: "✅ Logo cargado", description: "Analizando identidad de marca..." });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      setCurrentLogoB64(b64);

      if (currentAgencyId && brandId) {
        try {
          const blob = await base64ToBlob(b64);
          const { publicUrl } = await uploadBrandLogo({
            file: blob,
            agencyId: currentAgencyId,
            brandId,
            filename: file.name,
          });
          setCurrentLogoUrl(publicUrl);
        } catch (err: any) {
          console.error("[parrilla] logo upload failed", err);
          toast({
            title: "⚠️ El logo no se guardó en la nube",
            description: err?.message || "Sigue cargado para esta sesión. Reintenta más tarde.",
            variant: "destructive",
          });
        }
      }

      analyzeBrand(b64);
    };
    reader.readAsDataURL(file);
  }, [analyzeBrand, currentAgencyId, brandId]);

  const handleProductImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    const remaining = 4 - productImages.length;
    const toProcess = files.slice(0, remaining);
    toProcess.forEach((file, idx) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Archivo demasiado grande", description: "Máximo 10MB por imagen.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setProductImages(prev => {
          if (prev.length >= 4) return prev;
          return [...prev, b64];
        });
        if (idx === 0 && !productVision) {
          analyzeProduct(b64);
        }
      };
      reader.readAsDataURL(file);
    });
    toast({ title: "📸 Foto(s) cargada(s)", description: `${toProcess.length} foto(s) de producto añadida(s).` });
  }, [productImages.length, productVision, analyzeProduct]);

  // ═══════════ Generation ═══════════

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const renderPost = useCallback(async (post: PostCard, logoB64: string | undefined): Promise<string> => {
    const data = await apiCall<{ rendered_post?: string; image?: string }>("/api/v1/posts/render", {
      method: "POST",
      body: {
        format: post.format,
        brand: {
          name: brandName || "Mi Marca",
          logo_b64: logoB64 || undefined,
          primary_color: brand.primary_color,
          secondary_color: brand.secondary_color,
          accent_color: brand.accent_color,
          font_family: brand.font_family,
        },
        copy: {
          headline: post.headline || post.title || "",
          body: post.body || post.caption || "",
          cta: post.cta || "",
        },
        image_prompt: post.imagePrompt || "",
        style_description: post.styleDescription || "profesional y moderno",
        product_images: productImages,
      },
    });
    if (data.rendered_post) return data.rendered_post;
    if (data.image) return data.image;
    throw new Error("No image returned from API");
  }, [brand, brandName, productImages]);

  const handleGenerateParrilla = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(null);
    setGeneratingStatus("⚡ Preparando parrilla...");

    const activeFormats = Array.from(selectedFormats);
    const postsPerFormat = getFrequencyCount(frequency) * optionsPerPost;

    const postsConfig: { platform: string; format: string }[] = [];
    for (const formatId of activeFormats) {
      const fmt = ALL_FORMATS.find(f => f.id === formatId)!;
      for (let j = 0; j < postsPerFormat; j++) {
        postsConfig.push({ platform: fmt.platform, format: fmt.id });
      }
    }

    let logoB64: string | undefined = currentLogoB64 || undefined;
    if (!logoB64 && brandAssetBlobs.length > 0) {
      logoB64 = await blobToBase64(brandAssetBlobs[0]);
    }

    const skeletonPosts: PostCard[] = postsConfig.map((pc, idx) => ({
      id: `skeleton-${idx}`,
      platform: pc.platform as Platform,
      format: pc.format,
      status: "draft" as PostStatus,
      calendarDay: (idx * 2) + 1,
      isRendering: true,
    }));
    setPosts(skeletonPosts);
    setHasGenerated(true);
    setGenerationProgress({ completed: 0, total: postsConfig.length });
    setTimeout(() => {
      parrillaGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    const userMessages = chatMessages.filter(m => m.role === "user").map(m => m.content);
    const campaignDescription = userMessages.join("\n");

    const requestBody = {
      brand: {
        name: brandVision?.brand_name_detected || brandName || "Mi Marca",
        logo_b64: logoB64 || undefined,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        accent_color: brand.accent_color,
        font_family: brand.font_family,
      },
      campaign: {
        description: campaignDescription,
        tone: "",
        extras: "",
      },
      brand_vision: brandVision || null,
      product_vision: productVision || null,
      product_images: productImages,
      selected_product_ids: selectedProductIds,
      draft_id: draftId,
      posts_config: postsConfig,
      include_logo_in_image: includeLogoInImage,
      include_text_in_image: includeTextInImage,
      language,
    };

    const motivationalMessages = [
      "🎨 Creando escenas con tu producto...",
      "✨ Diseñando templates personalizados...",
      "🎯 Aplicando tu identidad de marca...",
      "📐 Ajustando composición y tipografía...",
      "🖌️ Refinando los detalles visuales...",
      "🚀 Casi listo, finalizando los últimos posts...",
    ];

    const startTime = Date.now();
    const secsPerPost = includeLogoInImage ? 60 : 30;
    const estimatedMins = Math.ceil((postsConfig.length * secsPerPost) / 60);
    const estimateLabel = includeLogoInImage
      ? `⏳ Tiempo estimado: ~${estimatedMins} min (integración de logo activada)`
      : `⏳ Tiempo estimado: ~${estimatedMins} min`;
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const msgIndex = Math.floor(elapsed / 15) % motivationalMessages.length;
      setGeneratingStatus(
        `⚡ Generando posts con IA...\n${motivationalMessages[msgIndex]}\n${estimateLabel}\n⏱️ ${mins}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);

    try {
      // ── Build shared payload ──
      const genPayload: GenerationRequest = {
        brand: requestBody.brand,
        campaign: requestBody.campaign,
        brand_vision: requestBody.brand_vision,
        product_vision: requestBody.product_vision,
        product_images: requestBody.product_images,
        selected_product_ids: requestBody.selected_product_ids,
        draft_id: requestBody.draft_id,
        posts_config: requestBody.posts_config,
        include_logo_in_image: requestBody.include_logo_in_image,
        include_text_in_image: requestBody.include_text_in_image,
        language: requestBody.language,
      };

      let job_id: string;
      let total_posts: number | undefined;
      let currentMode: "copy-first" | "full" = "copy-first";

      // ── Try copy-first, fallback to full ──
      try {
        const res = await generateCopyOnly(genPayload);
        job_id = res.job_id;
        total_posts = res.total_posts;
        currentMode = "copy-first";
      } catch (copyErr) {
        console.error("[generate] copy-first failed, falling back to full:", copyErr);
        const res = await generateFull(genPayload);
        job_id = res.job_id;
        total_posts = res.total_posts;
        currentMode = "full";
      }

      setGenerationMode(currentMode);
      setViewJobId(job_id);

      if (total_posts && total_posts !== postsConfig.length) {
        setGenerationProgress({ completed: 0, total: total_posts });
      }

      let isComplete = false;
      while (!isComplete) {
        await new Promise(r => setTimeout(r, 5000));

        let pollData: { job?: Record<string, unknown>; posts?: Record<string, unknown>[] };
        try {
          pollData = await apiCall<{ job?: Record<string, unknown>; posts?: Record<string, unknown>[] }>(`/api/v1/posts/job/${job_id}`);
        } catch {
          console.warn("Poll error, retrying...");
          continue;
        }

        const { job: jobData, posts: serverPosts } = pollData;

        if (jobData?.language && (jobData.language === "es" || jobData.language === "en")) {
          setDetectedLanguage(jobData.language as "es" | "en");
        }

        setPosts(prevPosts => {
          const updated = [...prevPosts];
          (serverPosts || []).forEach((sp: any) => {
            const idx = sp.index != null ? sp.index : undefined;
            if (idx == null || idx >= updated.length) return;

            const hasCopy = sp.status === "success";
            const hasImage = !!sp.rendered_image_url;
            const imgStatus: PostImageStatus = sp.image_status
              || (hasImage ? "ready" : "pending");

            if (hasCopy || sp.status === "error") {
              updated[idx] = {
                id: sp.id || `post-${job_id}-${idx}`,
                platform: (sp.platform || postsConfig[idx]?.platform || "instagram") as Platform,
                format: sp.format || postsConfig[idx]?.format || "instagram_feed",
                status: (sp.approval_status === "approved" && imgStatus === "ready" ? "scheduled" : "draft") as PostStatus,
                calendarDay: (idx * 2) + 1,
                image: sp.rendered_image_url || "",
                headline: sp.headline || "",
                body: sp.body || "",
                cta: sp.cta || "",
                imagePrompt: sp.image_prompt || "",
                isRendering: false,
                error: sp.status === "error" ? (sp.error_message || "Error al generar este post") : null,
                image_status: imgStatus,
                approval_status: sp.approval_status || "pending",
                approved_at: sp.approved_at || null,
              };
            }
          });
          return updated;
        });

        const completedCount = (jobData?.completed_posts as number) ?? 0;
        const totalCount = (jobData?.total_posts as number) ?? postsConfig.length;
        setGenerationProgress({ completed: completedCount, total: totalCount });

        if (jobData?.status === "completed" || jobData?.status === "failed") {
          isComplete = true;
        }
      }

      const finalPosts = await new Promise<PostCard[]>(resolve => {
        setPosts(prev => { resolve(prev); return prev; });
      });
      const errorCount = finalPosts.filter(p => p.error).length;
      if (currentMode === "copy-first") {
        const copyReady = finalPosts.filter(p => !p.error).length;
        toast({ title: "🚀 Copy generado", description: `${copyReady} posts listos para revisar. Apruébalos para generar imágenes.` });
      } else if (errorCount > 0) {
        toast({ title: "⚠️ Parrilla con errores", description: `${finalPosts.length - errorCount} OK, ${errorCount} fallidos. Reintenta los fallidos.`, variant: "destructive" });
      } else {
        toast({ title: "🚀 Parrilla generada", description: `${finalPosts.length} posts generados exitosamente.` });
      }
    } catch (error: any) {
      console.error("Error generating posts:", error);
      setPosts([]);
      setHasGenerated(false);
      setGenerationProgress(null);
      toast({
        title: "⚠️ No se pudo generar la parrilla",
        description: error.message || "No se pudo conectar con el servidor de generación.",
        variant: "destructive",
      });
    } finally {
      clearInterval(timerInterval);
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [selectedFormats, frequency, optionsPerPost, brandAssetBlobs, blobToBase64, chatMessages, brand, brandName, brandVision, productVision, id, productImages, includeLogoInImage, includeTextInImage, language]);

  // ═══════════ Post actions ═══════════

  const hasUserChatMessage = chatMessages.some(m => m.role === "user");
  const hasAnyProduct = productImages.length > 0 || selectedProductIds.length > 0;
  const canGenerate = brandDetected && hasAnyProduct && selectedFormats.size > 0 && hasUserChatMessage;
  const getDisabledReason = () => {
    if (!brandDetected) return "Sube tu logo primero";
    if (!hasAnyProduct) return "Selecciona un producto de tu marca o sube una imagen temporal";
    if (!hasUserChatMessage) return "Conversa con Nano Banano sobre tu campaña";
    if (selectedFormats.size === 0) return "Selecciona al menos una plataforma y formato";
    return "";
  };

  const togglePlatform = (key: keyof typeof platforms) => setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(formatId)) next.delete(formatId);
      else next.add(formatId);
      return next;
    });
  };

  const handleApprovePost = useCallback(async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // If copy-first mode and image hasn't been generated yet,
    // use the endpoint that approves + triggers image generation
    if (generationMode === "copy-first" && post.image_status === "pending") {
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, status: "scheduled" as PostStatus, approval_status: "approved" as const, approved_at: new Date().toISOString(), image_status: "generating" as PostImageStatus }
          : p
      ));
      toast({ title: "✅ Post aprobado — generando imagen..." });

      try {
        await approveAndGenerateImage(id);
        // Image will arrive via polling — start a lightweight poll for this post
        const pollImage = setInterval(async () => {
          try {
            const pollData = await apiCall<{ job?: Record<string, unknown>; posts?: Record<string, unknown>[] }>(`/api/v1/posts/job/${viewJobId}`);
            const sp = (pollData.posts || []).find((p: any) => p.id === id) as any;
            if (!sp) return;
            const imgStatus: PostImageStatus = sp.image_status || (sp.rendered_image_url ? "ready" : "generating");
            if (imgStatus === "ready" || imgStatus === "error") {
              clearInterval(pollImage);
              setPosts(prev => prev.map(p =>
                p.id === id
                  ? { ...p, image: sp.rendered_image_url || "", image_status: imgStatus }
                  : p
              ));
              if (imgStatus === "ready") {
                toast({ title: "🖼️ Imagen generada" });
              } else {
                toast({ title: "⚠️ Error generando imagen", variant: "destructive" });
              }
            }
          } catch {
            // Ignore polling errors
          }
        }, 5000);
        // Safety: stop polling after 3 minutes
        setTimeout(() => clearInterval(pollImage), 180000);
      } catch (err) {
        console.error("[approve+generate] failed:", err);
        setPosts(prev => prev.map(p =>
          p.id === id
            ? { ...p, status: "draft" as PostStatus, approval_status: "pending" as const, approved_at: null, image_status: "pending" as PostImageStatus }
            : p
        ));
        toast({ title: "Error al aprobar", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
      }
      return;
    }

    // Standard approval (image already exists or full mode)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "scheduled" as PostStatus, approval_status: "approved" as const, approved_at: new Date().toISOString() } : p));
    toast({ title: "✅ Post aprobado" });
    try {
      await approvePost(id);
    } catch (err) {
      console.error("[approve] failed:", err);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "draft" as PostStatus, approval_status: "pending" as const, approved_at: null } : p));
      toast({ title: "Error al aprobar el post", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
    }
  }, [posts, generationMode, viewJobId]);

  const handleRejectPost = useCallback(async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "draft" as PostStatus, approval_status: "rejected" as const } : p));
    toast({ title: "Post rechazado" });
    try {
      await rejectPost(id);
    } catch (err) {
      console.error("[reject] failed:", err);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "draft" as PostStatus, approval_status: "pending" as const } : p));
      toast({ title: "Error al rechazar el post", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
    }
  }, []);

  const handleApproveAll = useCallback(async () => {
    if (!viewJobId) return;
    const previousPosts = posts;

    // Optimistic update: approve all successful pending posts
    setPosts(prev => prev.map(p => {
      if ((p.status === "draft" || p.approval_status === "pending") && !p.error && p.approval_status !== "rejected") {
        return {
          ...p,
          status: "scheduled" as PostStatus,
          approval_status: "approved" as const,
          approved_at: new Date().toISOString(),
          image_status: (generationMode === "copy-first" && p.image_status === "pending"
            ? "generating"
            : p.image_status) as PostImageStatus | undefined,
        };
      }
      return p;
    }));

    try {
      if (generationMode === "copy-first") {
        // This endpoint approves + fires image generation for all pending posts
        const result = await generateAllApprovedImages(viewJobId);
        toast({ title: `🖼️ Generando ${result.count} imágenes...`, description: "Las imágenes aparecerán a medida que se completen." });

        // Start polling for image updates
        const pollImages = setInterval(async () => {
          try {
            const pollData = await apiCall<{ job?: Record<string, unknown>; posts?: Record<string, unknown>[] }>(`/api/v1/posts/job/${viewJobId}`);
            let allTerminal = true;
            setPosts(prev => prev.map(p => {
              const sp = (pollData.posts || []).find((s: any) => s.id === p.id) as any;
              if (!sp) return p;
              const imgStatus: PostImageStatus = sp.image_status || (sp.rendered_image_url ? "ready" : p.image_status || "pending");
              if (imgStatus === "generating") allTerminal = false;
              return {
                ...p,
                image: sp.rendered_image_url || p.image,
                image_status: imgStatus,
                approval_status: sp.approval_status || p.approval_status,
              };
            }));
            if (allTerminal) {
              clearInterval(pollImages);
              toast({ title: "✅ Todas las imágenes generadas" });
            }
          } catch {
            // Ignore polling errors
          }
        }, 5000);
        // Safety: stop after 5 minutes
        setTimeout(() => clearInterval(pollImages), 300000);
      } else {
        // Legacy mode: just persist approval in DB
        const count = await approveAllPosts(viewJobId);
        toast({ title: `✅ ${count} posts aprobados` });
      }
    } catch (err) {
      console.error("[approve-all] failed:", err);
      setPosts(previousPosts);
      toast({ title: "Error al aprobar posts", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
    }
  }, [viewJobId, posts, generationMode]);

  const platformPosts = posts.filter((p) => p.platform === activePlatform);

  const handleEditPost = useCallback((post: PostCard) => { setEditingPost(post); }, []);
  const handleClickImage = useCallback((post: PostCard) => {
    const idx = platformPosts.findIndex(p => p.id === post.id);
    setPreviewIndex(idx >= 0 ? idx : 0);
    setIsPreviewOpen(true);
  }, [platformPosts]);
  const handleSavePost = useCallback((updatedPost: PostCard) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    toast({ title: "💾 Post actualizado" });
  }, []);

  const handleRegenerateSingle = useCallback(async (post: PostCard) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: true, error: null } : p));
    try {
      let logoB64: string | undefined = currentLogoB64 || undefined;
      if (!logoB64 && brandAssetBlobs.length > 0) logoB64 = await blobToBase64(brandAssetBlobs[0]);
      const newImage = await renderPost(post, logoB64);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, image: newImage, isRendering: false, error: null } : p));
      toast({ title: "✨ Post regenerado" });
    } catch (err: any) {
      console.error("Error regenerating post:", err);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: false, error: "Error al regenerar" } : p));
      toast({ title: "⚠️ Error al regenerar", description: "No se pudo conectar con el servidor.", variant: "destructive" });
    }
  }, [brandAssetBlobs, blobToBase64, renderPost, id]);

  const handleDownloadPost = useCallback(async (post: PostCard) => {
    const hasVideo = post.video_url && (post.video_status === "completed" || post.video_status === "success");
    const url = hasVideo ? post.video_url! : post.image;
    if (!url) return;
    const ext = hasVideo ? "mp4" : "png";
    try {
      if (url.startsWith("http")) {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `post-${post.id}.${ext}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `post-${post.id}.${ext}`;
        a.click();
      }
    } catch {
      toast({ title: "⚠️ Error al descargar", description: `No se pudo descargar el ${hasVideo ? "video" : "imagen"}.`, variant: "destructive" });
    }
  }, []);

  const handleGenerateVideo = useCallback(async (post: PostCard) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "generating" as const } : p));
    toast({ title: "🎬 Generando video...", description: "Esto toma ~1-2 minutos." });

    try {
      await apiCall(`/api/v1/posts/${post.id}/video`, { method: "POST" });

      const poll = setInterval(async () => {
        try {
          const data = await apiCall<{ video_status: string; video_url?: string; video_error?: string }>(
            `/api/v1/posts/${post.id}/video/status`,
          );

          if (data.video_status === "completed" || data.video_status === "success") {
            clearInterval(poll);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_url: data.video_url, video_status: "completed" as const } : p));
            toast({ title: "🎬 Video listo ✅" });
          } else if (data.video_status === "error") {
            clearInterval(poll);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "error" as const, video_error: data.video_error } : p));
            toast({ title: "⚠️ Error al generar video", description: data.video_error || "Intenta de nuevo.", variant: "destructive" });
          }
        } catch {
          // Ignore polling errors, will retry
        }
      }, 5000);
    } catch {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "error" as const } : p));
      toast({ title: "⚠️ Error al iniciar video", variant: "destructive" });
    }
  }, []);

  // ═══════════ UI config constants ═══════════

  const formatsByPlatform = useMemo(() => {
    const groups: Record<string, FormatOption[]> = {};
    availableFormats.forEach(f => {
      if (!groups[f.platform]) groups[f.platform] = [];
      groups[f.platform].push(f);
    });
    return groups;
  }, [availableFormats]);

  const platformConfig = [
    { key: "instagram" as const, label: "Instagram", icon: Instagram, gradient: "from-pink-500 via-red-500 to-yellow-500", emoji: "📸" },
    { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, gradient: "from-slate-900 to-slate-700", emoji: "🎵" },
    { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, gradient: "from-blue-600 to-blue-700", emoji: "💼" },
    { key: "twitter" as const, label: "X / Twitter", icon: Twitter, gradient: "from-slate-800 to-slate-900", emoji: "🐦" },
  ];

  const platformLabelsMap: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", twitter: "X / Twitter" };

  // ═══════════ Return ═══════════

  return {
    // Route
    navigate, isNewParrilla, currentAgencyId,

    // Grid / view
    activePlatform, setActivePlatform,
    posts, setPosts, hasGenerated,
    isGenerating, generationProgress, generatingStatus,
    isClientView, setIsClientView,
    viewMode, setViewMode,
    generationMode,
    platformPosts,

    // Draft
    draftId, brandId, saveStatus, lastSavedAt,
    draftTitle, setDraftTitle,
    isEditingTitle, setIsEditingTitle,
    briefInfo, handleDiscardDraft,

    // Brand / assets
    brand, setBrand,
    brandName, setBrandName,
    brandAssets, setBrandAssets, setBrandAssetBlobs,
    currentLogoB64, setCurrentLogoB64,
    currentLogoUrl, setCurrentLogoUrl,
    brandDetected, setBrandDetected,
    isAnalyzingBrand,
    brandVision, setBrandVision,
    productVision,
    isAnalyzingProduct,
    productImages, setProductImages,
    brandProducts, setBrandProducts,
    selectedProductIds, setSelectedProductIds,
    includeLogoInImage, setIncludeLogoInImage,
    includeTextInImage, setIncludeTextInImage,

    // Language
    language, setLanguage,
    detectedLanguage,

    // Config
    platforms, selectedFormats, frequency, setFrequency,
    objective, setObjective, optionsPerPost, setOptionsPerPost,
    totalPosts,
    formatsByPlatform, platformConfig, platformLabelsMap,

    // Handlers
    handleFileUpload, handleProductImageUpload,
    sendChatMessage, chatMessages, isChatThinking,
    handleGenerateParrilla, canGenerate, getDisabledReason,
    togglePlatform, toggleFormat,
    handleApprovePost, handleApproveAll, handleRejectPost,
    handleEditPost, editingPost, setEditingPost,
    handleClickImage, previewIndex, isPreviewOpen, setIsPreviewOpen,
    handleSavePost, handleRegenerateSingle,
    handleDownloadPost, handleGenerateVideo,

    // Refs
    parrillaGridRef,
  };
}
