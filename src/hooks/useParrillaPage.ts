import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "use-debounce";
import { useAgency } from "@/contexts/AgencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveBrand } from "@/contexts/ActiveBrandContext";
import { createDraft, getDraftWithPosts, patchDraft, deleteDraft, type DraftPatch } from "@/lib/draftService";
import { approvePost, rejectPost, approveAllPosts } from "@/lib/postService";
import { generateFullParrilla, pollJob } from "@/lib/generationService";
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
  const { brand: activeBrand } = useActiveBrand();

  const isNewParrilla = id === "nueva" || !id;
  const queryDraftId = searchParams.get("draft_id");
  const queryBrandId = searchParams.get("brand_id");
  const [viewJobId, setViewJobId] = useState<string | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState<boolean>(false);
  const [isHydrating, setIsHydrating] = useState<boolean>(!isNewParrilla || !!queryDraftId);

  // ── Grid / view state ──
  const [activePlatform, setActivePlatform] = useState<string>("instagram");
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ copy: number; image: number; total: number } | null>(null);
  const [isClientView, setIsClientView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

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

  // ═══════════ Helpers: map server data to UI state ═══════════

  const mapServerPostToCard = useCallback((sp: Record<string, any>, idx: number, jobId?: string): PostCard => {
    const hasImage = !!sp.rendered_image_url;
    const imgStatus: PostImageStatus = sp.image_status || (hasImage ? "ready" : "pending");
    return {
      id: sp.id || `post-${jobId || "unknown"}-${idx}`,
      platform: (sp.platform || "instagram") as Platform,
      format: sp.format || "instagram_feed",
      status: (sp.approval_status === "approved" && (imgStatus === "ready" || hasImage) ? "scheduled" : "draft") as PostStatus,
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
      image_status: imgStatus,
      approval_status: sp.approval_status || "pending",
      approved_at: sp.approved_at || null,
    };
  }, []);

  /** Applies saved draft config to local state. Shared by both "nueva" + direct-URL flows. */
  const applyDraftConfig = useCallback((d: { config: unknown; chat_messages: unknown; selected_product_ids: string[] | null; title: string | null; brand_id: string; brief_id: string | null; id: string }) => {
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
    if (Array.isArray(d.chat_messages) && (d.chat_messages as any[]).length > 0) setChatMessages(d.chat_messages as any);
    if (Array.isArray(d.selected_product_ids) && d.selected_product_ids.length > 0) {
      setSelectedProductIds(d.selected_product_ids);
    }
    if (d.title) setDraftTitle(d.title);
  }, []);

  /** Loads brand row data (name, logo, colors) from Supabase brands table. */
  const loadBrandRow = useCallback(async (bId: string, cancelled: { current: boolean }) => {
    const { data: brandRow } = await supabase
      .from("brands")
      .select("name, logo_url, primary_color, secondary_color, accent_colors, font_family")
      .eq("id", bId)
      .maybeSingle();
    if (cancelled.current || !brandRow) return;
    if (brandRow.name) setBrandName((prev) => prev || brandRow.name);
    if (brandRow.logo_url) {
      setCurrentLogoUrl(brandRow.logo_url);
      setBrandAssets((prev) => prev.length === 0 ? [brandRow.logo_url!] : prev);
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
  }, []);

  // ═══════════ Draft hydration & auto-save (Figma-style) ═══════════

  // Helper: apply loaded posts to state and activate their platforms
  const applyLoadedPosts = useCallback((serverPosts: Record<string, any>[], jobId?: string) => {
    const loaded: PostCard[] = serverPosts
      .filter((sp: any) => sp.status === "success" || sp.status === "error")
      .map((sp: any, idx: number) => mapServerPostToCard(sp, idx, jobId));

    const platformsPresent = new Set(loaded.map((p) => p.platform));
    if (platformsPresent.size > 0) {
      setPlatforms({
        instagram: platformsPresent.has("instagram" as Platform),
        tiktok: platformsPresent.has("tiktok" as Platform),
        linkedin: platformsPresent.has("linkedin" as Platform),
        twitter: platformsPresent.has("twitter" as Platform),
      });
      setActivePlatform(Array.from(platformsPresent)[0] as string);
    }

    setPosts(loaded);
    setHasGenerated(loaded.length > 0);
    return loaded;
  }, [mapServerPostToCard]);

  // ── Flow A: /parrilla/nueva (?draft_id=X or ?brand_id=X) ──
  useEffect(() => {
    if (!isNewParrilla) return;
    if (!currentAgencyId || !user) return;
    if (draftHydrated) return;

    let cancelled = false;
    const cancelledRef = { current: false };
    (async () => {
      setIsHydrating(true);
      console.info("[parrilla/hydrate] Flow A start", { queryDraftId, queryBrandId });
      try {
        if (queryDraftId) {
          // Hydrate draft + any existing posts using the enriched endpoint
          const result = await getDraftWithPosts(queryDraftId);
          if (cancelled) return;
          if (!result) {
            toast({ title: "Borrador no encontrado", variant: "destructive" });
            navigate("/parrillas");
            return;
          }
          applyDraftConfig(result.draft);

          // Load brand row for logo/colors
          if (result.draft.brand_id) {
            await loadBrandRow(result.draft.brand_id, cancelledRef);
          }
          if (cancelled) return;

          // Load brief info
          if (result.draft.brief_id) {
            const { data: briefRow } = await supabase
              .from("brand_briefs")
              .select("id, title")
              .eq("id", result.draft.brief_id)
              .maybeSingle();
            if (briefRow && !cancelled) setBriefInfo(briefRow as any);
          }

          // If posts exist, show them
          if (result.posts && result.posts.length > 0) {
            const latestJobId = result.jobs[0]?.id;
            applyLoadedPosts(result.posts, latestJobId);
            if (latestJobId) setViewJobId(latestJobId);
            // If there's an active job, set language from it
            const activeJob = result.jobs.find(j => j.status === "processing" || j.status === "pending");
            if (activeJob?.language && (activeJob.language === "es" || activeJob.language === "en")) {
              setDetectedLanguage(activeJob.language as "es" | "en");
            }
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
          await loadBrandRow(queryBrandId, cancelledRef);
          if (cancelled) return;
          setSearchParams({ draft_id: created.id }, { replace: true });
          setDraftHydrated(true);
          return;
        }

        setDraftHydrated(true);
      } catch (err: any) {
        console.error("[parrilla] hydration error", err);
        toast({ title: "Error cargando borrador", description: err?.message, variant: "destructive" });
        setDraftHydrated(true);
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => { cancelled = true; cancelledRef.current = true; };
  }, [isNewParrilla, currentAgencyId, user, queryDraftId, queryBrandId, draftHydrated, navigate, setSearchParams, applyDraftConfig, loadBrandRow, applyLoadedPosts]);

  // ── Flow B: /parrilla/{uuid} (direct URL — could be draft_id OR job_id) ──
  useEffect(() => {
    if (isNewParrilla) return;  // Flow A handles /nueva
    if (!id) return;
    if (!currentAgencyId) return;

    let cancelled = false;
    const cancelledRef = { current: false };
    (async () => {
      setIsHydrating(true);
      setIsLoadingJob(true);
      console.info("[parrilla/hydrate] Flow B start", { id });
      try {
        // 1. Try as draft_id first (most common new flow)
        const draftResult = await getDraftWithPosts(id);
        if (cancelled) return;

        if (draftResult) {
          applyDraftConfig(draftResult.draft);
          if (draftResult.draft.brand_id) {
            await loadBrandRow(draftResult.draft.brand_id, cancelledRef);
          }
          if (cancelled) return;

          if (draftResult.draft.brief_id) {
            const { data: briefRow } = await supabase
              .from("brand_briefs")
              .select("id, title")
              .eq("id", draftResult.draft.brief_id)
              .maybeSingle();
            if (briefRow && !cancelled) setBriefInfo(briefRow as any);
          }

          if (draftResult.posts && draftResult.posts.length > 0) {
            const latestJobId = draftResult.jobs[0]?.id;
            applyLoadedPosts(draftResult.posts, latestJobId);
            if (latestJobId) setViewJobId(latestJobId);
            const activeJob = draftResult.jobs.find(j => j.status === "processing" || j.status === "pending");
            if (activeJob?.language && (activeJob.language === "es" || activeJob.language === "en")) {
              setDetectedLanguage(activeJob.language as "es" | "en");
            }
          }

          setDraftHydrated(true);
          return;
        }

        // 2. Fallback: try as job_id (legacy URLs)
        const { data: job, error: jobErr } = await supabase
          .from("generation_jobs")
          .select("id, brand_id, brand_name, campaign_description, language, status, created_at")
          .eq("id", id)
          .maybeSingle();

        if (cancelled) return;

        if (jobErr || !job) {
          toast({ title: "Parrilla no encontrada", variant: "destructive" });
          navigate("/parrillas");
          return;
        }

        // Hydrate from job
        setViewJobId(job.id);
        if (job.brand_id) {
          setBrandId(job.brand_id);
          await loadBrandRow(job.brand_id, cancelledRef);
          if (cancelled) return;
          if (job.brand_name && !brandName) setBrandName(job.brand_name);
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
          .eq("job_id", id)
          .order("index", { ascending: true });

        if (cancelled) return;
        if (gpErr) {
          console.error("[parrilla] load generated_posts failed", gpErr);
          toast({ title: "Error cargando posts", description: gpErr.message, variant: "destructive" });
          return;
        }

        applyLoadedPosts((gp ?? []) as Record<string, unknown>[], id);
        setDraftHydrated(true);
      } catch (err: any) {
        console.error("[parrilla] direct-url hydration error", err);
        toast({ title: "Error cargando parrilla", description: err?.message, variant: "destructive" });
      } finally {
        if (!cancelled) {
          setIsLoadingJob(false);
          setIsHydrating(false);
        }
      }
    })();
    return () => { cancelled = true; cancelledRef.current = true; };
  }, [id, isNewParrilla, currentAgencyId, navigate, applyDraftConfig, loadBrandRow, applyLoadedPosts, brandName]);

  // ═══════════ View existing job (for post-generate polling results, NOT initial load) ═══════════
  // Guard: only runs when viewJobId is set AFTER initial hydration (e.g. after a re-generation)

  useEffect(() => {
    if (!viewJobId) return;
    if (!currentAgencyId) return;
    // Do NOT re-fetch if we already hydrated or are generating — avoids race condition
    if (isGenerating) return;
    if (!draftHydrated) return;
    // If we already have posts for this job, skip
    if (posts.length > 0 && posts.some(p => p.id?.includes(viewJobId) || !p.id?.startsWith("skeleton"))) return;

    let cancelled = false;
    const cancelledRef = { current: false };
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
          // Job not found — probably still being created. Skip silently.
          return;
        }

        if (job.brand_id && !brandId) {
          setBrandId(job.brand_id);
          await loadBrandRow(job.brand_id, cancelledRef);
          if (cancelled) return;
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
          return;
        }

        if (gp && gp.length > 0) {
          applyLoadedPosts((gp ?? []) as Record<string, unknown>[], viewJobId);
        }
      } catch (err: any) {
        console.error("[parrilla] view-job load error", err);
      } finally {
        if (!cancelled) setIsLoadingJob(false);
      }
    })();
    return () => { cancelled = true; cancelledRef.current = true; };
  }, [viewJobId, currentAgencyId, isGenerating, draftHydrated, posts.length, brandId, loadBrandRow, applyLoadedPosts]);

  // ═══════════ Active brand redirect ═══════════
  // When user changes the active brand in the global selector while on /parrilla/nueva,
  // redirect to a new parrilla for that brand (unless a draft is already being worked on).

  const activeBrandRedirectRef = useRef(false);
  useEffect(() => {
    if (!isNewParrilla) return;
    if (!activeBrand?.id) return;
    // Skip the first render (initial brand selection) and only redirect on CHANGES
    if (!activeBrandRedirectRef.current) {
      activeBrandRedirectRef.current = true;
      return;
    }
    // Don't redirect if user already has chat messages or posts (active work)
    if (hasGenerated || chatMessages.some(m => m.role === "user")) return;
    // If the brand is already matching, skip
    if (activeBrand.id === brandId) return;
    navigate(`/parrilla/nueva?brand_id=${activeBrand.id}`, { replace: true });
  }, [activeBrand?.id, isNewParrilla, brandId, hasGenerated, chatMessages, navigate]);

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

  const handleGenerateParrilla = useCallback(async () => {
    console.info("[parrilla/generate/start]", { draftId, brandId, brandName, language, objective, formats: Array.from(selectedFormats), frequency, optionsPerPost });
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

    // 1. Skeletons inmediatos
    const skeletonPosts: PostCard[] = postsConfig.map((pc, idx) => ({
      id: `skeleton-${idx}`,
      platform: pc.platform as Platform,
      format: pc.format,
      status: "draft" as PostStatus,
      calendarDay: (idx * 2) + 1,
      isRendering: true,
      image_status: "pending" as PostImageStatus,
    }));
    setPosts(skeletonPosts);
    setHasGenerated(true);
    setGenerationProgress({ copy: 0, image: 0, total: postsConfig.length });
    setTimeout(() => {
      parrillaGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    const userMessages = chatMessages.filter(m => m.role === "user").map(m => m.content);
    const campaignDescription = userMessages.join("\n");

    const motivationalMessages = [
      "🎨 Creando escenas con tu producto...",
      "✨ Diseñando templates personalizados...",
      "🎯 Aplicando tu identidad de marca...",
      "📐 Ajustando composición y tipografía...",
      "🖌️ Refinando los detalles visuales...",
      "🚀 Casi listo, finalizando los últimos posts...",
    ];

    const startTime = Date.now();
    const estimatedMins = Math.ceil((postsConfig.length * 45) / 60);
    const estimateLabel = `⏳ Tiempo estimado: ~${estimatedMins} min`;
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const msgIndex = Math.floor(elapsed / 15) % motivationalMessages.length;
      setGeneratingStatus(
        `⚡ Generando tu parrilla...\n${motivationalMessages[msgIndex]}\n${estimateLabel}\n⏱️ ${mins}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);

    try {
      // ── Build payload ──
      const genPayload: GenerationRequest = {
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
        objective: objective as GenerationRequest["objective"],
      };

      // 2. POST a /posts/generate (flow completo, copy + imagenes)
      const res = await generateFullParrilla(genPayload);
      const { job_id, total_posts } = res;
      console.info("[parrilla/generate/dispatched]", { job_id, total_posts });

      if (total_posts && total_posts !== postsConfig.length) {
        setGenerationProgress({ copy: 0, image: 0, total: total_posts });
      }

      // 3. Polling hasta que TODAS las imágenes estén listas (o error)
      const MAX_POLLS = 72; // 6 min (72 × 5s)
      let attempts = 0;
      let lastMapped: PostCard[] = [];

      while (attempts < MAX_POLLS) {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;

        let pollData: { job: Record<string, unknown>; posts: Record<string, unknown>[] };
        try {
          pollData = await pollJob(job_id);
          console.info("[parrilla/poll]", {
            job_id,
            status: pollData.job?.status,
            completed: pollData.job?.completed_posts,
            total: pollData.job?.total_posts,
            postsReturned: pollData.posts?.length,
          });
        } catch {
          console.warn(`[parrilla/poll] error (attempt ${attempts}), retrying...`);
          if (attempts >= MAX_POLLS) break;
          continue;
        }

        const { job: jobData, posts: serverPosts } = pollData;

        if (jobData?.language && (jobData.language === "es" || jobData.language === "en")) {
          setDetectedLanguage(jobData.language as "es" | "en");
        }

        // Progressive UI update — map server posts + fill remaining skeletons
        if (serverPosts && serverPosts.length > 0) {
          const mapped: PostCard[] = (serverPosts as any[]).map((sp, idx) => {
            if (sp.status === "success" || sp.status === "error") {
              return mapServerPostToCard(sp, idx, job_id);
            }
            // Still generating — show as skeleton with copy if available
            return {
              id: sp.id || `skeleton-${idx}`,
              platform: (sp.platform || postsConfig[idx]?.platform || "instagram") as Platform,
              format: sp.format || postsConfig[idx]?.format || "instagram_feed",
              status: "draft" as PostStatus,
              calendarDay: (idx * 2) + 1,
              headline: sp.headline || undefined,
              body: sp.body || undefined,
              cta: sp.cta || undefined,
              isRendering: !sp.headline, // show skeleton if no copy yet
              image_status: (sp.image_status || "pending") as PostImageStatus,
            };
          });

          const totalExpected = (jobData?.total_posts as number) ?? postsConfig.length;
          const remaining = Math.max(0, totalExpected - mapped.length);
          const extraSkeletons: PostCard[] = Array.from({ length: remaining }, (_, i) => ({
            id: `skeleton-extra-${i}`,
            platform: (postsConfig[mapped.length + i]?.platform || "instagram") as Platform,
            format: postsConfig[mapped.length + i]?.format || "instagram_feed",
            status: "draft" as PostStatus,
            calendarDay: ((mapped.length + i) * 2) + 1,
            isRendering: true,
            image_status: "pending" as PostImageStatus,
          }));

          lastMapped = [...mapped, ...extraSkeletons];
          setPosts(lastMapped);
        }

        // Dual progress: copy + image
        const totalCount = (jobData?.total_posts as number) ?? postsConfig.length;
        const copyReady = lastMapped.filter(p => !p.isRendering && (p.headline || p.error)).length;
        const imageReady = lastMapped.filter(p => p.image_status === "ready" || (p.image && p.image_status !== "generating" && p.image_status !== "pending")).length;
        setGenerationProgress({ copy: copyReady, image: imageReady, total: totalCount });

        // Terminal condition: all posts have final image_status (ready/error) or post status=error
        const allTerminal = lastMapped.length > 0 && lastMapped.every(
          p => p.image_status === "ready" || p.image_status === "error" || p.error
        );

        if (allTerminal || jobData?.status === "failed") {
          break;
        }
      }

      if (attempts >= MAX_POLLS) {
        console.warn("[parrilla/poll] timeout after 6min");
      }

      // Polling complete — now safe to set viewJobId
      console.info("[parrilla/poll/complete]", { job_id });
      setViewJobId(job_id);

      // 4. Final toast
      const realPosts = lastMapped.filter(p => !p.isRendering);
      const readyCount = realPosts.filter(p => !p.error && p.image_status === "ready").length;
      const errorCount = realPosts.filter(p => p.error || p.image_status === "error").length;

      if (readyCount === 0 && errorCount > 0) {
        toast({
          title: "⚠️ No se pudo generar la parrilla",
          description: "Revisa el brief o intenta de nuevo",
          variant: "destructive",
        });
      } else {
        const msg = errorCount > 0
          ? `${readyCount} posts listos, ${errorCount} con error`
          : `${readyCount} posts listos para revisar`;
        toast({ title: "🚀 Parrilla generada", description: msg });
      }

    } catch (error: any) {
      console.error("[parrilla/generate] error", error);
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
  }, [selectedFormats, frequency, optionsPerPost, brandAssetBlobs, blobToBase64, chatMessages, brand, brandName, brandVision, productVision, productImages, includeLogoInImage, includeTextInImage, language, objective, draftId, selectedProductIds, mapServerPostToCard]);

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

    // Optimistic update — mark as approved (cosmetic, no image trigger)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "scheduled" as PostStatus, approval_status: "approved" as const, approved_at: new Date().toISOString() } : p));
    toast({ title: "✅ Post aprobado" });
    try {
      await approvePost(id);
    } catch (err) {
      console.error("[approve] failed:", err);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "draft" as PostStatus, approval_status: "pending" as const, approved_at: null } : p));
      toast({ title: "Error al aprobar el post", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
    }
  }, [posts]);

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

    // Optimistic update: approve all successful pending posts (cosmetic only)
    setPosts(prev => prev.map(p => {
      if ((p.status === "draft" || p.approval_status === "pending") && !p.error && p.approval_status !== "rejected") {
        return {
          ...p,
          status: "scheduled" as PostStatus,
          approval_status: "approved" as const,
          approved_at: new Date().toISOString(),
        };
      }
      return p;
    }));

    try {
      const count = await approveAllPosts(viewJobId);
      toast({ title: `✅ ${count} posts aprobados` });
    } catch (err) {
      console.error("[approve-all] failed:", err);
      setPosts(previousPosts);
      toast({ title: "Error al aprobar posts", description: err instanceof Error ? err.message : "Intenta de nuevo", variant: "destructive" });
    }
  }, [viewJobId, posts]);

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
    // TODO: Wire to POST /api/v1/posts/{id}/regenerate when backend endpoint is ready
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: true, error: null, image_status: "generating" as PostImageStatus } : p));
    try {
      const result = await apiCall<{ post_id: string; status: string }>(`/api/v1/posts/${post.id}/regenerate`, { method: "POST" });
      // Poll until the post's image is ready
      let attempts = 0;
      while (attempts < 36) { // 3 min max
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
        try {
          if (!viewJobId) break;
          const pollData = await pollJob(viewJobId);
          const sp = (pollData.posts || []).find((p: any) => p.id === post.id) as any;
          if (!sp) continue;
          const imgStatus: PostImageStatus = sp.image_status || (sp.rendered_image_url ? "ready" : "generating");
          if (imgStatus === "ready" || imgStatus === "error") {
            const updated = mapServerPostToCard(sp, 0, viewJobId);
            setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
            if (imgStatus === "ready") {
              toast({ title: "✨ Post regenerado" });
            } else {
              toast({ title: "⚠️ Error al regenerar imagen", variant: "destructive" });
            }
            return;
          }
        } catch { /* ignore poll errors */ }
      }
      // Timeout
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: false, error: "Timeout al regenerar" } : p));
      toast({ title: "⚠️ Timeout al regenerar", variant: "destructive" });
    } catch (err: any) {
      console.error("[regenerate-single] error:", err);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: false, error: "Error al regenerar" } : p));
      toast({ title: "⚠️ Error al regenerar", description: err?.message || "No se pudo conectar con el servidor.", variant: "destructive" });
    }
  }, [viewJobId, mapServerPostToCard]);

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

    // Loading
    isHydrating, isLoadingJob,

    // Grid / view
    activePlatform, setActivePlatform,
    posts, setPosts, hasGenerated,
    isGenerating, generationProgress, generatingStatus,
    isClientView, setIsClientView,
    viewMode, setViewMode,
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
