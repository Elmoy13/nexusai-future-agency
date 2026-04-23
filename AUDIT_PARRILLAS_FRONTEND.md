# Auditoría Frontend — Flujo de Parrillas

**Fecha:** 2025-04-23  
**Scope:** Solo auditoría, sin fix.

---

## A. Diagrama del flujo actual

```
CREACIÓN DE PARRILLA
═══════════════════════

1. User navega a /parrilla/nueva?brand_id=X
   └── Route: /parrilla/:id  → <Parrilla /> (render shell)
   └── Hook: useParrillaPage() (toda la lógica)

2. Hydration del draft (useEffect línea ~143):
   ├── Si hay ?draft_id → getDraft(draftId) + hidratar estado
   ├── Si hay ?brand_id → createDraft() → redirigir a ?draft_id=<nuevo>
   └── Si hay :id que no sea "nueva" → buscar como job_id existente

3. User sube logo → handleFileUpload()
   └── Llama POST /api/v1/brand/analyze-vision
   └── Setea brandVision, brand colors, brandDetected=true

4. User sube producto → handleProductImageUpload()
   └── Llama POST /api/v1/product/analyze
   └── Setea productVision

5. User chatea con agente → sendChatMessage()
   └── POST /api/v1/chat

6. User configura: platforms, formats, frequency, objective, variantes
   └── totalPosts = selectedFormats.size × freq × optionsPerPost

7. canGenerate = brandDetected && hasAnyProduct && selectedFormats.size > 0 && hasUserChatMessage

8. User hace clic en "Generar" → handleGenerateParrilla() (línea ~727)
   ├── 8a. Crea skeletonPosts[] con isRendering=true, setPosts(skeletonPosts)
   ├── 8b. setHasGenerated(true) → la UI cambia de "vacía" → grid con skeletons
   ├── 8c. Construye GenerationRequest payload
   ├── 8d. Intenta POST /api/v1/posts/generate-copy-only (copy-first mode)
   │   └── Si falla → fallback a POST /api/v1/posts/generate (full mode)
   ├── 8e. Recibe { job_id, total_posts, status }
   ├── 8f. setViewJobId(job_id)
   ├── 8g. POLLING LOOP: cada 5 segundos
   │   └── GET /api/v1/posts/job/{job_id}
   │   └── Response shape: { job: {...}, posts: [...] }
   │   └── Actualiza setPosts() progresivamente (por sp.index)
   │   └── Actualiza generationProgress
   │   └── Para cuando jobData.status === "completed" | "failed"
   ├── 8h. Cuenta posts exitosos en finalPosts
   └── 8i. Toast: "🚀 Copy generado · {copyReady} posts listos para revisar"

9. FASE 2 — Aprobación (copy-first mode)
   ├── handleApprovePost(id) → POST /api/v1/posts/{id}/approve-and-generate-image
   │   └── Polling 5s por post hasta image_status = "ready"
   └── handleApproveAll() → POST /api/v1/posts/job/{jobId}/generate-all-approved-images
       └── Polling 5s global hasta todas terminales

VISTA DE PARRILLA EXISTENTE
════════════════════════════

1. User navega a /parrilla/{job_id} (sin "nueva")
2. candidateJobId = id → setViewJobId(id)
3. useEffect (línea ~237): fetch job + generated_posts de Supabase
4. Mapea a PostCard[], setPosts(loaded), setHasGenerated(true)
```

---

## B. Dónde se rompe — Bug "0 posts después de Generar"

### Localización del bug

**Archivo:** `src/hooks/useParrillaPage.ts`, líneas ~837-930 (polling loop + setPosts)

### Flujo del toast "0 posts"

El toast se genera en la línea ~925:
```ts
const copyReady = finalPosts.filter(p => !p.error).length;
toast({ title: "🚀 Copy generado", description: `${copyReady} posts listos para revisar...` });
```

El valor `copyReady` viene de `finalPosts`, que se obtiene así:
```ts
const finalPosts = await new Promise<PostCard[]>(resolve => {
  setPosts(prev => { resolve(prev); return prev; });
});
```

### ¿Por qué `copyReady` puede ser 0?

**Hipótesis principal (alta probabilidad): El polling lee posts pero no los mapea al array.**

El polling loop (línea ~870) hace:
```ts
(serverPosts || []).forEach((sp: any) => {
  const idx = sp.index != null ? sp.index : undefined;
  if (idx == null || idx >= updated.length) return;  // ← AQUÍ
  ...
});
```

**Escenario de fallo:**
1. El frontend crea `skeletonPosts` con longitud = `postsConfig.length` (calculado localmente)
2. El backend podría generar un número diferente de posts o usar índices diferentes
3. Si `sp.index >= updated.length`, el post se descarta silenciosamente
4. Si el backend no envía `sp.index`, `idx` es `undefined` y el guard `idx == null` descarta el post
5. Resultado: `finalPosts` sigue siendo todos skeletons → `filter(p => !p.error)` cuenta skeletons con `isRendering=true` pero sin `error` → contaría N, PERO los skeletons no tienen `headline/body/cta` → **visualmente parecen vacíos**

**Hipótesis alternativa (también probable): El backend responde con `job.status = "completed"` inmediatamente.**

Si el backend marca el job como `completed` antes de que los posts se generen (job async con workers), el polling loop termina en la primera iteración con 0 posts en `serverPosts`. El loop sale, `finalPosts` tiene solo skeletons.

**Hipótesis 3: El endpoint `/api/v1/posts/job/{job_id}` devuelve los posts en un campo diferente al esperado.**

El frontend espera `{ job: {...}, posts: [...] }`. Si el backend devuelve `{ job: {...}, items: [...] }` o `{ posts: {...} }` (objeto, no array), `serverPosts` sería `undefined` y el forEach no ejecuta.

### El estado "Tu parrilla está vacía" no debería aparecer

La UI muestra "Tu parrilla está vacía" cuando `hasGenerated === false` (línea ~510 de Parrilla.tsx):
```tsx
{hasGenerated ? (
  <Tabs ...>  // Grid de posts
) : (
  <div>"Tu parrilla está vacía"</div>
)}
```

Dado que `setHasGenerated(true)` se ejecuta ANTES de llamar al API (línea ~755), **el mensaje "vacía" NO debería aparecer durante la generación**. Pero si la generación falla y cae al catch (línea ~931):
```ts
} catch (error: any) {
  setPosts([]);
  setHasGenerated(false);  // ← Reset a vacía
```

**Esto explica el escenario reportado:** Si el primer POST a `/generate-copy-only` falla Y el fallback a `/generate` también falla, `hasGenerated` vuelve a false → "vacía". Si solo uno falla y el otro funciona pero el polling sale inmediatamente, muestra el toast con 0 y la grid con skeletons o vacía si los skeletons no matchean alguna plataforma del tab activo.

### Verificación adicional: `platformPosts` filtering

```ts
const platformPosts = posts.filter((p) => p.platform === activePlatform);
```

Si `activePlatform` es "instagram" pero los posts generados tienen `platform` en un formato diferente (ej: "Instagram" con mayúscula), el filtro devolvería 0 posts para ese tab → "Sin posts para esta plataforma".

---

## C. Respuesta esperada del backend

### POST `/api/v1/posts/generate-copy-only`
**Request body (GenerationRequest):**
```json
{
  "brand": { "name": "...", "logo_b64": "...", "primary_color": "...", "secondary_color": "...", "accent_color": "...", "font_family": "..." },
  "campaign": { "description": "...", "tone": "", "extras": "" },
  "brand_vision": { ... },
  "product_vision": { ... },
  "product_images": ["data:image/..."],
  "selected_product_ids": ["uuid1"],
  "draft_id": "uuid",
  "posts_config": [
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "tiktok", "format": "tiktok_video" }
  ],
  "include_logo_in_image": false,
  "include_text_in_image": false,
  "language": "auto"
}
```

**Expected response:**
```json
{
  "job_id": "uuid",
  "total_posts": 6,
  "status": "pending"
}
```

### GET `/api/v1/posts/job/{job_id}` (polling)
**Expected response:**
```json
{
  "job": {
    "status": "processing" | "completed" | "failed",
    "total_posts": 6,
    "completed_posts": 3,
    "language": "es"
  },
  "posts": [
    {
      "id": "uuid",
      "index": 0,
      "platform": "instagram",
      "format": "instagram_feed",
      "status": "success",
      "headline": "...",
      "body": "...",
      "cta": "...",
      "image_prompt": "...",
      "rendered_image_url": null,
      "image_status": "pending",
      "approval_status": "pending",
      "approved_at": null,
      "video_url": null,
      "video_status": null
    }
  ]
}
```

**NOTA:** No pude verificar la respuesta real del backend (requiere ejecución en vivo). Este shape es lo que el frontend ESPERA basado en el código.

---

## D. Lista de bugs / deuda técnica UX

### CRÍTICO

1. **Toast "0 posts" + "vacía" simultáneos**  
   El polling loop puede terminar sin mapear posts al array si los índices no coinciden con el tamaño del skeleton array. El guard `idx >= updated.length` descarta posts silenciosamente.  
   **Archivo:** `src/hooks/useParrillaPage.ts` ~L880  

2. **No hay manejo del caso "job completado pero posts vacíos"**  
   Si `jobData.status === "completed"` pero `serverPosts` está vacío (backend completó sin generar nada), el loop termina limpiamente con toast "0 posts" sin dar ningún error al usuario.  

3. **`frequency` y `objective` NO se envían al backend**  
   El `GenerationRequest` no incluye `frequency` ni `objective`. El número de posts es calculado localmente y enviado como `posts_config[]` (cada entry = 1 post). El "3/semana" solo afecta cuántos items tiene `posts_config`, no le dice al backend la frecuencia. El `objective` ("engagement", "conversión", "awareness") **se descarta completamente** — no se envía en ningún field.  
   **Archivo:** `src/lib/generationService.ts` (interface `GenerationRequest`)  

### ALTO

4. **El `setViewJobId(job_id)` dispara un useEffect que refetchea TODO desde Supabase**  
   En la línea ~237, hay un `useEffect` que observa `viewJobId`. Cuando `handleGenerateParrilla` setea `setViewJobId(job_id)` (L820), este effect se dispara, hace un fetch independiente a Supabase de `generation_jobs` + `generated_posts`, y SOBREESCRIBE `posts` y `hasGenerated`. **Si este effect corre mientras el polling loop aún está activo, compiten por `setPosts`.** El job puede no existir aún en Supabase cuando el effect corre → redirección fantasma a `/dashboard`.  
   **Archivo:** `src/hooks/useParrillaPage.ts` ~L237  

5. **No hay invalidación de React Query — todo es useState manual**  
   A pesar de que `QueryClientProvider` está en App.tsx, la feature de parrillas no usa React Query. Todo es `useState` + polling manual. No hay cache invalidation, no hay deduplication de requests, no hay retry automático inteligente.

6. **El breadcrumb "Directorio / Marca / Parrilla" no navega a `/parrillas` (hub)**  
   Navega a `/dashboard` y a `/brand/{brandId}`, pero no hay link al listado de parrillas.

### MEDIO

7. **`canGenerate` requiere `hasAnyProduct` pero no informa claramente**  
   Si el usuario no tiene productos cargados ni imágenes temporales, el botón aparece disabled con tooltip "Selecciona un producto de tu marca o sube una imagen temporal" — pero el tooltip solo aparece al hover, no es obvio en mobile.

8. **Los toggles "Integrar logo" e "Incluir texto" SÍ se envían al backend** (`include_logo_in_image`, `include_text_in_image` en el payload). ✅ Verificado.

9. **Skeletons se muestran con platform del config local, pero tabs filtran por `activePlatform`**  
   Si el tab activo es "instagram" pero los primeros skeletons son de "tiktok", el usuario ve "Sin posts para esta plataforma" en el tab de Instagram durante la generación.

10. **El botón "Aprobar Todo" está correctamente disabled cuando no hay posts** (`posts.length === 0 || stats.pending === 0`). ✅ Verificado.

11. **No hay validación del brief antes de generar**  
    `canGenerate` solo verifica `hasUserChatMessage` (que el user haya escrito ALGO en el chat). No valida longitud mínima ni calidad del mensaje.

### BAJO

12. **Motivational messages hardcoded en español**  
    Si `language` es "en", los mensajes durante generación siguen en español.

13. **Auto-save no persiste datos de posts generados**  
    El `draftSnapshotRef` guarda config/brand/chat pero NO los posts. Si el usuario recarga después de generar, pierde los posts del draft (se requiere navegar al job ID).

14. **`productVision` no se actualiza si se suben más fotos después de la primera**  
    `analyzeProduct` solo se llama con `idx === 0 && !productVision` (L693). Si el user sube una segunda foto diferente, el productVision original persiste.

15. **Polling no tiene backoff exponencial**  
    Siempre 5 segundos. En caso de errores de red, sigue cada 5s indefinidamente (solo `console.warn("Poll error, retrying...")`).

---

## E. Propuesta de fix

### Fix puntual del bug "0 posts" (SMALL)
1. **En el polling loop**, no confiar en `sp.index` para mapear a un array de tamaño fijo. En cambio, reemplazar el array completo con los posts del servidor:
   ```
   // En vez de: updated[idx] = ...
   // Hacer: reconstruir el array desde serverPosts + rellenar con skeletons para los faltantes
   ```
2. **Remover el guard `idx >= updated.length`** — si el backend manda más posts, agregarlos.
3. **No setear `setViewJobId` durante la generación** para evitar la race condition con el useEffect de vista. Setearlo SOLO después de que el polling termine.

### Fix de la race condition `setViewJobId` (SMALL)
4. Agregar un guard en el `useEffect` de viewJobId que no corra si `isGenerating === true`.

### Enviar `objective` al backend (SMALL)
5. Agregar `objective` al `GenerationRequest` interface y al payload.

### Migrar state a React Query (LARGE — no recomendado ahora)
- Sería lo ideal pero es un refactor grande. Mantener polling manual por ahora.

### Componentes a tocar:
| Archivo | Cambio |
|---------|--------|
| `src/hooks/useParrillaPage.ts` | Fix polling mapping, guard race condition, enviar objective |
| `src/lib/generationService.ts` | Agregar `objective` a `GenerationRequest` |
| `src/pages/Parrilla.tsx` | No changes needed (es render shell) |

**Estimación global:** SMALL (1-2 días dev) para los fixes puntuales.

---

## F. Archivos clave del feature

| Archivo | Propósito |
|---------|-----------|
| `src/pages/Parrilla.tsx` | Render shell — solo UI, delega todo a useParrillaPage |
| `src/hooks/useParrillaPage.ts` | **TODO** el state, effects, y handlers (~1300 líneas) |
| `src/lib/generationService.ts` | API calls: `generateCopyOnly`, `generateFull`, `getJob`, listings |
| `src/lib/postService.ts` | CRUD de posts: approve, reject, approve-all, generate images |
| `src/lib/apiClient.ts` | HTTP client centralizado con JWT injection |
| `src/lib/draftService.ts` | CRUD de borradores `parrilla_drafts` |
| `src/lib/productService.ts` | Listado de productos por marca |
| `src/lib/brandStorage.ts` | Upload de logos a Supabase Storage |
| `src/types/parrilla.ts` | Todos los types + constants del feature |
| `src/components/parrilla/RenderedPostCard.tsx` | Card individual con estados (skeleton, error, pending image, ready) |
| `src/components/parrilla/ShimmerSkeleton.tsx` | Skeleton loading animation |
| `src/components/parrilla/StatusBadge.tsx` | Badge de approval/image status |
| `src/components/parrilla/BrandAssetsSidebar.tsx` | Panel izquierdo (logo, productos, colores, toggles) |
| `src/components/parrilla/EditPostModal.tsx` | Modal edición de copy de un post |
| `src/components/parrilla/ImagePreviewModal.tsx` | Lightbox/carousel de imágenes |
| `src/components/parrilla/CalendarView.tsx` | Vista mensual alternativa |
| `src/components/parrilla/PlatformIcon.tsx` | Iconos de plataforma |
| `src/components/dashboard/ParrillasHub.tsx` | Hub/listado de todas las parrillas por marca |
| `src/components/dashboard/ParrillaProductSelector.tsx` | Selector de productos persistentes |
| `src/components/dashboard/CreativeAgentChat.tsx` | Chat con el agente de contenido |
| `src/contexts/ActiveBrandContext.tsx` | Contexto global de marca activa (NO usado en Parrilla) |
| `src/contexts/AgencyContext.tsx` | Contexto de agencia actual |

---

## G. Preguntas abiertas

### 1. ¿El flujo es de 2 fases o 1?
**R: Es de 2 fases**, confirmado en código. El frontend intenta `generate-copy-only` primero (Sprint 3.5 cost control). Si falla, cae a `generate` (full, 1 fase). En modo copy-first:
- Fase 1: Genera solo copy (headline, body, cta, image_prompt). `image_status = "pending"`.
- Fase 2: User aprueba → `approve-and-generate-image` → fal.ai genera imagen.

**El frontend SÍ está alineado con Sprint 3.5.** La UI de `RenderedPostCard` maneja correctamente el estado de "imagen pendiente".

### 2. ¿Qué shape exacto devuelve el backend?
No pude verificar sin ejecutar. El frontend espera `{ job: { status, total_posts, completed_posts, language }, posts: [{ id, index, platform, format, status, headline, body, cta, image_prompt, rendered_image_url, image_status, approval_status, ... }] }`.

**Si el backend devuelve un shape diferente (ej: `items` en vez de `posts`, o posts como objeto indexado en vez de array), ese es el bug.** Necesitamos el response real del Network tab.

### 3. ¿La frecuencia (3/semana) impacta algo en el backend?
**No.** Solo determina cuántos items tiene `posts_config[]` (cálculo local). El backend no recibe el valor "3-week" — solo recibe N entries en `posts_config`.

### 4. ¿El `objective` afecta la generación?
**No, se descarta.** No se envía en el payload. El backend no lo recibe.

### 5. ¿Hay websocket / SSE?
**No.** Todo es polling HTTP cada 5 segundos. No hay realtime channel.

### 6. ¿Hay código muerto?
- `renderPost()` (línea ~706) — se usa solo en `handleRegenerateSingle`, nunca en la generación principal. Parece remanente de antes del refactor a generación server-side.
- `isClientView` state y toggle existen pero no hay forma visible en la UI de activarlo (no hay botón "Vista cliente"). Parece un feature a medio implementar.
- `handleDownloadPost` maneja video pero `handleGenerateVideo` no tiene UI visible en cards sin video.

### 7. ¿Hay race condition entre el polling y el useEffect de viewJobId?
**Sí, es probable.** `setViewJobId(job_id)` en L820 dispara el useEffect de L237 que hace fetch independiente a Supabase. Este fetch puede correr en paralelo al polling loop y sobreescribir `posts` con datos parciales o vacíos desde Supabase (que puede tener lag respecto al API).

### 8. Brand scoping — ¿hay fugas?
**No hay fugas evidentes**, pero hay un gap:
- `useParrillaPage` NO usa `useActiveBrand` (el contexto global de marca activa). Usa su propio `brandId` derivado del query param `?brand_id=` o del draft.
- El payload de generación no envía `brand_id` como campo separado — la marca está implícita en el `draft_id`.
- Si el user cambia la marca activa en el selector del DashboardLayout mientras está en `/parrilla/nueva`, la parrilla **no refleja el cambio** — sigue usando la marca del draft original.
- `ParrillasHub` sí usa `currentAgencyId` para scope, así que las parrillas de otras agencias no se muestran. ✅

---

## H. Resumen ejecutivo

**El feature está ~80% funcional.** La arquitectura es correcta (2 fases copy-first, polling, aprobación individual/masiva, product selector). Los problemas son:

1. **Bug crítico:** El mapping de posts del polling loop es frágil (depende de `sp.index` match exacto con skeleton array). Si el backend envía índices inesperados o el array tiene diferente longitud → 0 posts visibles.

2. **Race condition:** `setViewJobId` durante generación activa dispara un effect que compite con el polling por `setPosts`.

3. **`objective` no se envía** — feature cosmético que no impacta generación.

4. **Toda la feature es ~1300 líneas en un solo hook**, sin React Query, sin cache, sin error boundaries. Funcional pero frágil.

5. **Para confirmar la causa raíz exacta del bug, se necesita el JSON real del backend** en el Network tab al hacer clic en "Generar".
