import { useParrillaPage } from "@/hooks/useParrillaPage";
import PlatformIcon from "@/components/parrilla/PlatformIcon";
import ImagePreviewModal from "@/components/parrilla/ImagePreviewModal";
import RenderedPostCard from "@/components/parrilla/RenderedPostCard";
import CalendarView from "@/components/parrilla/CalendarView";
import EditPostModal from "@/components/parrilla/EditPostModal";
import BrandAssetsSidebar from "@/components/parrilla/BrandAssetsSidebar";
import { DEFAULT_BRAND } from "@/types/parrilla";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import CreativeAgentChat from "@/components/dashboard/CreativeAgentChat";
import {
  ArrowLeft, CheckCircle2, Sparkles, Loader2,
  Zap, Target, Users, Heart, Check,
  LayoutGrid, CalendarDays, Home, Hexagon,
  FileText as BriefIcon,
} from "lucide-react";

/* â”€â”€ Main Page â”€â”€ */
const Parrilla = () => {
  const {
    navigate, isNewParrilla,
    isHydrating, isLoadingJob,
    activePlatform, setActivePlatform,
    posts, hasGenerated,
    isGenerating, generationProgress, generatingStatus,
    isClientView, viewMode, setViewMode,
    platformPosts,
    draftId, brandId, saveStatus, lastSavedAt,
    draftTitle, setDraftTitle,
    isEditingTitle, setIsEditingTitle,
    briefInfo, handleDiscardDraft,
    brand, setBrand,
    brandName, setBrandName,
    brandAssets, setBrandAssetBlobs,
    currentLogoB64, setCurrentLogoB64,
    currentLogoUrl, setCurrentLogoUrl,
    brandDetected, setBrandDetected, setBrandAssets,
    isAnalyzingBrand,
    brandVision, setBrandVision,
    productVision, isAnalyzingProduct,
    productImages, setProductImages,
    brandProducts, setBrandProducts,
    selectedProductIds, setSelectedProductIds,
    includeLogoInImage, setIncludeLogoInImage,
    includeTextInImage, setIncludeTextInImage,
    language, setLanguage, detectedLanguage,
    platforms, selectedFormats,
    frequency, setFrequency,
    objective, setObjective,
    optionsPerPost, setOptionsPerPost,
    totalPosts,
    formatsByPlatform, platformConfig, platformLabelsMap,
    handleFileUpload, handleProductImageUpload,
    sendChatMessage, chatMessages, isChatThinking,
    handleGenerateParrilla, canGenerate, getDisabledReason,
    togglePlatform, toggleFormat,
    handleApprovePost, handleApproveAll, handleRejectPost,
    handleEditPost, editingPost, setEditingPost,
    handleClickImage, previewIndex, isPreviewOpen, setIsPreviewOpen,
    handleSavePost, handleRegenerateSingle,
    handleDownloadPost, handleGenerateVideo,
    parrillaGridRef,
    currentAgencyId,
  } = useParrillaPage();

  const stats = useMemo(() => ({
    total: posts.length,
    approved: posts.filter(p => p.approval_status === "approved").length,
    pending: posts.filter(p => p.approval_status === "pending" && !p.error && !p.isRendering).length,
    rejected: posts.filter(p => p.approval_status === "rejected").length,
    generatingImages: posts.filter(p => p.image_status === "generating").length,
    imagesReady: posts.filter(p => p.image_status === "ready").length,
  }), [posts]);

  // Show loading skeleton while hydrating draft/job data
  if (isHydrating || isLoadingJob) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando parrilla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col px-6 py-3">
          {!isClientView && (
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 hover:text-foreground transition-colors"><Home size={12} /> Directorio</button>
              <span>/</span>
              <button
                onClick={() => brandId && navigate(`/brand/${brandId}`)}
                disabled={!brandId}
                className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-default"
              >
                <Hexagon size={12} /> {brandName || "Marca"}
              </button>
              <span>/</span>
              <span className="flex items-center gap-1 text-foreground font-medium"><CalendarDays size={12} /> Parrilla</span>
            </nav>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">Parrilla de Contenido</h1>
                  {detectedLanguage && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 transition-all">
                      ðŸŒ {detectedLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isEditingTitle ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.currentTarget.blur(); }
                        if (e.key === "Escape") { setIsEditingTitle(false); }
                      }}
                      placeholder="Parrilla sin tÃ­tulo"
                      className="bg-transparent border-b border-primary/40 outline-none text-xs text-foreground px-0.5 min-w-[160px]"
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="hover:text-foreground transition-colors text-left"
                      title="Click para editar"
                    >
                      {draftTitle || "Parrilla sin tÃ­tulo"}
                    </button>
                  )}
                  <span>Â·</span>
                  <span>{brandName || "Sin marca"}</span>
                </p>
                {briefInfo && (
                  <button
                    onClick={() => navigate(`/agente?briefId=${briefInfo.id}`)}
                    className="mt-1 inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                    title="Abrir brief"
                  >
                    <BriefIcon size={10} /> Basado en brief: {briefInfo.title}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              {isNewParrilla && draftId && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  {saveStatus === "saving" && (
                    <span className="flex items-center gap-1 text-amber-400"><Loader2 size={11} className="animate-spin" /> Guardandoâ€¦</span>
                  )}
                  {saveStatus === "saved" && lastSavedAt && (
                    <span className="flex items-center gap-1 text-emerald-400"><Check size={11} /> Guardado</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="flex items-center gap-1 text-destructive">âš ï¸ Error al guardar</span>
                  )}
                  {saveStatus === "idle" && (
                    <span className="text-muted-foreground/60">Borrador</span>
                  )}
                  <button
                    onClick={handleDiscardDraft}
                    className="ml-2 text-muted-foreground/60 hover:text-destructive bg-transparent border-none cursor-pointer text-[11px] underline-offset-2 hover:underline"
                  >
                    Descartar
                  </button>
                </div>
              )}
              <Button
                onClick={handleApproveAll}
                disabled={posts.length === 0 || stats.pending === 0}
                className="gap-2 text-sm h-9 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40"
              >
                <CheckCircle2 size={14} /> Aprobar Todo{stats.pending > 0 ? ` (${stats.pending})` : ""}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-start">
        {/* Left Panel - Brand Assets */}
        <AnimatePresence>
          {!isClientView && (
            <BrandAssetsSidebar
              brandName={brandName}
              onBrandNameChange={setBrandName}
              brand={brand}
              onBrandChange={setBrand}
              brandAssets={brandAssets}
              onFileUpload={handleFileUpload}
              onClearLogo={() => {
                setBrandAssets([]);
                setBrandAssetBlobs([]);
                setBrandDetected(false);
                setBrandVision(null);
                setBrand(DEFAULT_BRAND);
                setCurrentLogoB64(null);
                setCurrentLogoUrl(null);
                toast({ title: "Logo eliminado de esta sesiÃ³n" });
              }}
              brandDetected={brandDetected}
              isAnalyzingBrand={isAnalyzingBrand}
              brandVision={brandVision}
              includeLogoInImage={includeLogoInImage}
              onIncludeLogoChange={setIncludeLogoInImage}
              includeTextInImage={includeTextInImage}
              onIncludeTextChange={setIncludeTextInImage}
              language={language}
              onLanguageChange={setLanguage}
              detectedLanguage={detectedLanguage}
              brandId={brandId}
              agencyId={currentAgencyId}
              brandProducts={brandProducts}
              selectedProductIds={selectedProductIds}
              onToggleProduct={(pid) => {
                setSelectedProductIds((prev) =>
                  prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
                );
              }}
              onProductCreated={(product) => {
                setBrandProducts((prev) => (prev ? [...prev, product] : [product]));
                setSelectedProductIds((prev) =>
                  prev.includes(product.id) ? prev : [...prev, product.id]
                );
              }}
              productImages={productImages}
              onProductImagesChange={setProductImages}
              onProductImageUpload={handleProductImageUpload}
              isAnalyzingProduct={isAnalyzingProduct}
              productVision={productVision}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Agent Section */}
          <AnimatePresence>
            {!isClientView && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                className="bg-card border-b border-border p-5 overflow-hidden"
              >
                <div className="max-w-6xl mx-auto space-y-5">
                  {/* Agent header + chat */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-primary flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">Nano Banano Content Agent âœ¨</h2>
                      <p className="text-xs text-muted-foreground">IA generativa para parrillas de contenido social media</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <CreativeAgentChat
                      messages={chatMessages}
                      onSendMessage={sendChatMessage}
                      isThinking={isChatThinking}
                      isGenerating={isGenerating}
                      generatingStatus={generatingStatus}
                      brandDetected={brandDetected}
                    />
                  </div>

                  {/* Row 1: Platforms */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plataformas</p>
                    <div className="flex flex-wrap gap-2">
                      {platformConfig.map((p) => (
                        <button key={p.key} onClick={() => togglePlatform(p.key)}
                          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                            platforms[p.key] ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md`}>
                            <p.icon size={14} className="text-white" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{p.emoji} {p.label}</span>
                          {platforms[p.key] && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check size={12} className="text-primary-foreground" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Formats (dynamic) */}
                  <AnimatePresence>
                    {Object.keys(formatsByPlatform).length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos</p>
                        <div className="space-y-2.5">
                          {Object.entries(formatsByPlatform).map(([platform, formats]) => (
                            <div key={platform} className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-20 shrink-0">{platformLabelsMap[platform]}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {formats.map(fmt => (
                                  <button key={fmt.id} onClick={() => toggleFormat(fmt.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                                      selectedFormats.has(fmt.id)
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/40"
                                    }`}
                                  >
                                    <span className="text-sm">{fmt.icon}</span>
                                    <span>{fmt.label}</span>
                                    <span className="text-[9px] text-muted-foreground">{fmt.width}Ã—{fmt.height}</span>
                                    {selectedFormats.has(fmt.id) && <Check size={10} className="text-primary" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Row 3: Config + Generate */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Frecuencia</span>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-week">3/semana</SelectItem>
                          <SelectItem value="5-week">5/semana</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Objetivo</span>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement"><div className="flex items-center gap-2"><Heart size={14} className="text-pink-500" /> Engagement</div></SelectItem>
                          <SelectItem value="conversion"><div className="flex items-center gap-2"><Target size={14} className="text-emerald-500" /> ConversiÃ³n</div></SelectItem>
                          <SelectItem value="awareness"><div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> Awareness</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 relative group/var">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Variantes</span>
                      <Select value={String(optionsPerPost)} onValueChange={(v) => setOptionsPerPost(Number(v))}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-16 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-card border border-border text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/var:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        NÃºmero de variaciones de diseÃ±o por cada post
                      </div>
                    </div>

                    <div className="w-px h-8 bg-border" />

                    {selectedFormats.size > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Se generarÃ¡n <span className="text-foreground font-bold">{totalPosts}</span> posts
                      </span>
                    )}

                    <div className="relative group/gen ml-auto">
                      <Button onClick={handleGenerateParrilla}
                        disabled={isGenerating || !canGenerate}
                        className={`h-11 px-6 text-sm font-semibold shadow-lg text-white transition-all ${
                          canGenerate && !isGenerating
                            ? "bg-gradient-to-r from-violet-600 via-purple-600 to-primary hover:from-violet-700 hover:via-purple-700 hover:to-primary/80 shadow-primary/25 animate-pulse"
                            : "bg-gradient-to-r from-violet-600 via-purple-600 to-primary opacity-50"
                        }`}
                      >
                        {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> {generatingStatus || "Generando..."}</> : <><Zap size={16} className="mr-2" /> Generar ðŸš€</>}
                      </Button>
                      {!canGenerate && !isGenerating && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/gen:opacity-100 transition-opacity pointer-events-none shadow-lg">
                          {getDisabledReason()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <AnimatePresence>
            {isGenerating && generationProgress && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="px-6 pt-5"
              >
                <div className="max-w-2xl mx-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">
                      ⚡ Generando tu parrilla...
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {Math.round((generationProgress.image / generationProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>✍️ Copy: {generationProgress.copy}/{generationProgress.total}</span>
                      <span>🎨 Imágenes: {generationProgress.image}/{generationProgress.total}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(generationProgress.image / generationProgress.total) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <section ref={parrillaGridRef} className="px-6 py-5" id="parrilla-grid">
            {hasGenerated ? (
              <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v)} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList className="h-11 p-1 bg-secondary">
                    {Object.entries(platforms).filter(([_, v]) => v).map(([key]) => (
                      <TabsTrigger key={key} value={key} className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <PlatformIcon platform={key} size={14} /> {platformLabelsMap[key]}
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter(p => p.platform === key).length}</Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex items-center p-1 rounded-xl bg-secondary">
                    <button onClick={() => setViewMode("kanban")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "kanban" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    ><LayoutGrid size={16} /> Grid</button>
                    <button onClick={() => setViewMode("calendar")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "calendar" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    ><CalendarDays size={16} /> Mensual</button>
                  </div>
                </div>

                {/* ── Stats bar ── */}
                {stats.total > 0 && (
                  <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
                    <span>{stats.total} posts</span>
                    {stats.approved > 0 && <span className="text-emerald-500">{stats.approved} aprobados</span>}
                    {stats.pending > 0 && <span className="text-amber-500">{stats.pending} pendientes</span>}
                    {stats.rejected > 0 && <span className="text-red-400">{stats.rejected} rechazados</span>}
                    {stats.generatingImages > 0 && (
                      <span className="text-primary flex items-center gap-1">
                        <Loader2 className="inline w-3 h-3 animate-spin" />
                        {stats.generatingImages} imágenes generándose
                      </span>
                    )}
                    {stats.imagesReady > 0 && (
                      <span className="text-emerald-400">{stats.imagesReady} imágenes listas</span>
                    )}
                  </div>
                )}

                {viewMode === "kanban" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                      {platformPosts.map((post) => (
                        <RenderedPostCard key={post.id} post={post}
                          onEdit={handleEditPost} onRegenerate={handleRegenerateSingle}
                          onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                          onRejectStatus={handleRejectPost}
                          isClientView={isClientView} onClickImage={handleClickImage}
                          onGenerateVideo={handleGenerateVideo}
                        />
                      ))}
                    </AnimatePresence>
                    {platformPosts.length === 0 && (
                      <div className="col-span-full py-20 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                        Sin posts para esta plataforma
                      </div>
                    )}
                  </div>
                ) : (
                  <div><CalendarView posts={posts} /></div>
                )}
              </Tabs>
            ) : (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={36} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Tu parrilla estÃ¡ vacÃ­a</h3>
                  <p className="text-sm mb-6 text-muted-foreground">
                    {isClientView ? "Espera a que el equipo creativo genere el contenido." : "Sube tu logo, configura la marca y haz clic en \"Generar\" para crear contenido con IA."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Edit Modal */}
      <EditPostModal post={editingPost} open={!!editingPost} onClose={() => setEditingPost(null)} onSave={handleSavePost} brand={brand} />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        posts={platformPosts}
        initialIndex={previewIndex}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onApprove={handleApprovePost}
        onDownload={handleDownloadPost}
      />
    </div>
  );
};

export default Parrilla;
