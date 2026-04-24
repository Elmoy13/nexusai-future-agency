# Auditoría Frontend — Payload de Generación de Parrilla

**Fecha:** 2025-04-23  
**Scope:** Solo auditoría, sin fix.

---

## Sección A — Estado de los toggles (código + defaults)

### A1. `useState` de los toggles

**Archivo:** `src/hooks/useParrillaPage.ts`, línea 97-98

```ts
const [includeLogoInImage, setIncludeLogoInImage] = useState(false);
const [includeTextInImage, setIncludeTextInImage] = useState(false);
```

**Valor por defecto: `false` para ambos.**

Esto significa que si el usuario NO toca los toggles, los campos `include_logo_in_image` e `include_text_in_image` se mandan como `false` al backend.

Si el usuario activa ambos toggles a ON, los valores se actualizan a `true` correctamente (verificado en la cadena de props hasta el `<Switch>`).

### A2. JSX de los toggles

**Archivo:** `src/components/parrilla/BrandAssetsSidebar.tsx`, líneas 152-169

```tsx
<div className="flex items-center justify-between gap-2 px-1">
  <label htmlFor="logo-integrate" className="text-[11px] font-medium text-foreground cursor-pointer">
    ✨ Integrar logo en la imagen
  </label>
  <Switch id="logo-integrate" checked={includeLogoInImage} onCheckedChange={onIncludeLogoChange} />
</div>
<p className="text-[10px] px-1 leading-relaxed" style={{ color: includeLogoInImage ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
  {includeLogoInImage
    ? "La IA integrará tu logo dentro de la escena (tarda un poco más)"
    : "El logo aparecerá como marca de agua en la esquina"}
</p>
<div className="flex items-center justify-between gap-2 px-1 pt-1">
  <label htmlFor="text-integrate" className="text-[11px] font-medium text-foreground cursor-pointer">
    📝 Incluir texto en la imagen
  </label>
  <Switch id="text-integrate" checked={includeTextInImage} onCheckedChange={onIncludeTextChange} />
</div>
```

**Verificación:** `onIncludeLogoChange` y `onIncludeTextChange` se mapean directamente a `setIncludeLogoInImage` y `setIncludeTextInImage` en `Parrilla.tsx` líneas 223-226:

```tsx
includeLogoInImage={includeLogoInImage}
onIncludeLogoChange={setIncludeLogoInImage}
includeTextInImage={includeTextInImage}
onIncludeTextChange={setIncludeTextInImage}
```

✅ **Los toggles SÍ actualizan el state correctamente.** No hay desconexión en la cadena hook → page → sidebar → Switch.

---

## Sección B — Función `handleGenerateParrilla` completa

**Archivo:** `src/hooks/useParrillaPage.ts`, líneas ~862-1075

La función completa está en el hook. El fragmento crítico es la **construcción del payload** (líneas ~930-957):

```ts
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
```

La llamada `generateFullParrilla` está en `src/lib/generationService.ts` línea ~44:

```ts
export async function generateFullParrilla(
  payload: GenerationRequest
): Promise<GenerationResponse> {
  return await apiCall<GenerationResponse>(
    "/api/v1/posts/generate",
    { method: "POST", body: payload }
  );
}
```

`apiCall` en `src/lib/apiClient.ts` línea ~39 hace `JSON.stringify(options.body)`, así que el payload se serializa tal cual como JSON.

### B2. Campos del payload enviados

| Campo en payload | Tipo | ¿Se envía? | Source |
|---|---|---|---|
| `brand.name` | string | ✅ | `brandVision?.brand_name_detected \|\| brandName \|\| "Mi Marca"` |
| `brand.logo_b64` | string \| undefined | ⚠️ **Condicional** | `currentLogoB64 \|\| undefined` (ver análisis en Sección E) |
| `brand.primary_color` | string | ✅ | `brand.primary_color` |
| `brand.secondary_color` | string | ✅ | `brand.secondary_color` |
| `brand.accent_color` | string | ✅ | `brand.accent_color` |
| `brand.font_family` | string | ✅ | `brand.font_family` |
| `campaign.description` | string | ✅ | Mensajes del usuario en chat, concatenados con `\n` |
| `campaign.tone` | string | ✅ | **Siempre `""`** — no se captura del UI |
| `campaign.extras` | string | ✅ | **Siempre `""`** — no se captura del UI |
| `brand_vision` | object \| null | ✅ | Resultado de `/api/v1/brand/analyze-vision` |
| `product_vision` | object \| null | ✅ | Resultado de `/api/v1/product/analyze` |
| `product_images` | string[] | ⚠️ **Solo temporales** | Base64 de imágenes subidas manualmente (NO las de productos persistentes) |
| `selected_product_ids` | string[] | ✅ | UUIDs de productos persistentes seleccionados |
| `draft_id` | string \| null | ✅ | UUID del borrador |
| `posts_config` | array | ✅ | `[{ platform, format }]` para cada post a generar |
| `include_logo_in_image` | boolean | ✅ | Estado del toggle (snake_case correcto) |
| `include_text_in_image` | boolean | ✅ | Estado del toggle (snake_case correcto) |
| `language` | string | ✅ | `"auto"`, `"es"`, o `"en"` |
| `objective` | string | ✅ | `"engagement"`, `"conversion"`, o `"awareness"` |

---

## Sección C — Payload REAL (análisis estático)

**No tengo acceso a DevTools/Network tab para capturar el payload real en runtime.** Sin embargo, puedo reconstruir exactamente qué se serializa basado en el análisis estático.

### Payload reconstruido (ejemplo con toggles ON, producto seleccionado, logo subido)

```json
{
  "brand": {
    "name": "Bacachito Feliz",
    "logo_b64": "data:image/png;base64,iVBOR...<base64 del logo>...",
    "primary_color": "#FF6B35",
    "secondary_color": "#004E89",
    "accent_color": "#F1FAEE",
    "font_family": "Montserrat"
  },
  "campaign": {
    "description": "Hola, quiero una campaña para...\nClaro, necesito más engagement...",
    "tone": "",
    "extras": ""
  },
  "brand_vision": {
    "palette": ["#FF6B35", "#004E89", "#F1FAEE", "#A8DADC", "#457B9D"],
    "primary_color": "#FF6B35",
    "logo_description": "Logo circular con banano sonriente...",
    "brand_name": "Bacachito Feliz",
    "personality": "cheerful, friendly, approachable"
  },
  "product_vision": {
    "product_type": "pantalla digital",
    "product_description": "Pantalla LED interactiva..."
  },
  "product_images": ["data:image/jpeg;base64,/9j/4AAQ..."],
  "selected_product_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "draft_id": "660e8400-e29b-41d4-a716-446655440001",
  "posts_config": [
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "instagram", "format": "instagram_feed" },
    { "platform": "tiktok", "format": "tiktok_video" },
    { "platform": "tiktok", "format": "tiktok_video" },
    { "platform": "tiktok", "format": "tiktok_video" },
    { "platform": "tiktok", "format": "tiktok_video" },
    { "platform": "tiktok", "format": "tiktok_video" },
    { "platform": "tiktok", "format": "tiktok_video" }
  ],
  "include_logo_in_image": true,
  "include_text_in_image": true,
  "language": "auto",
  "objective": "engagement"
}
```

### ⚠️ Para obtener el payload real

Se necesita UNO de:
1. Abrir DevTools → Network → hacer clic en "Generar" → ver la request a `/api/v1/posts/generate` → pestaña "Payload"
2. Agregar **temporalmente** antes de línea ~959 en `useParrillaPage.ts`:
   ```ts
   console.log('[generate] payload', JSON.stringify(genPayload, null, 2));
   ```

---

## Sección D — Selección de producto y cómo llega al payload

### D1. Componente de selección de productos

**Archivo:** `src/components/dashboard/ParrillaProductSelector.tsx`

Muestra la lista de `BrandProduct[]` (cargados de Supabase `brand_products` table). Cada producto tiene `id`, `name`, `image_url`, `is_primary`.

### D2. Qué se guarda al seleccionar un producto

**Archivo:** `src/hooks/useParrillaPage.ts`, línea 77:

```ts
const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
```

Al hacer clic en un producto en `ParrillaProductSelector`, se llama `onToggle(productId)` que mapea a `setSelectedProductIds` (toggle add/remove del UUID).

**Solo se guarda el `product_id` (UUID).** No se guarda el `image_url` del producto persistente.

### D3. Cómo llega al payload

En el payload (línea ~950):

```ts
selected_product_ids: selectedProductIds,  // Array de UUIDs
product_images: productImages,             // Base64 de imágenes TEMPORALES
```

**Hay DOS rutas**:
1. **Productos persistentes** → se mandan como `selected_product_ids` (UUIDs). El backend debe resolver las URLs de imagen desde la tabla `brand_products`.
2. **Imágenes temporales** → se mandan como `product_images` (array de strings base64). Estas son las fotos subidas en la sección "Imágenes temporales".

### ⚠️ Hallazgo crítico sobre imágenes de producto

Si el usuario SOLO selecciona productos persistentes (de la lista "Productos de tu marca") y NO sube imágenes temporales:
- `product_images` = `[]` (vacío)
- `selected_product_ids` = `["uuid1", "uuid2"]`

**El backend DEBE resolver las imágenes desde `selected_product_ids`.** Si el backend necesita las imágenes inline (base64/URL) y no las resuelve de los IDs, **las imágenes del producto NO aparecerán en los posts generados**.

---

## Sección E — Logo del brand y cómo llega al payload

### E1. De dónde viene el logo

El logo puede venir de dos fuentes:

1. **Upload directo** — El usuario sube un archivo en `BrandAssetsSidebar`. Se guarda como base64 en `currentLogoB64` (`useParrillaPage.ts` línea 73):
   ```ts
   const [currentLogoB64, setCurrentLogoB64] = useState<string | null>(null);
   ```

2. **Pre-cargado de Supabase** — En `loadBrandRow()` (línea ~193), se lee `brands.logo_url` de la DB y se guarda en `currentLogoUrl`:
   ```ts
   if (brandRow.logo_url) {
     setCurrentLogoUrl(brandRow.logo_url);
     setBrandAssets((prev) => prev.length === 0 ? [brandRow.logo_url!] : prev);
     setBrandDetected(true);
   }
   ```

**NO se usa `useActiveBrand` (ActiveBrandContext)** para la parrilla. El hook tiene su propio state independiente.

### E2. Cómo llega al payload

En `handleGenerateParrilla` (líneas ~880-884):

```ts
let logoB64: string | undefined = currentLogoB64 || undefined;
if (!logoB64 && brandAssetBlobs.length > 0) {
  logoB64 = await blobToBase64(brandAssetBlobs[0]);
}
```

Luego en el payload:
```ts
brand: {
  name: brandVision?.brand_name_detected || brandName || "Mi Marca",
  logo_b64: logoB64 || undefined,   // ← AQUÍ
  ...
},
```

### ⚠️ Hallazgo crítico sobre el logo

**Escenario de fallo:**

1. El usuario navega a `/parrilla/nueva?brand_id=X`
2. `loadBrandRow()` carga `brandRow.logo_url` (URL de Supabase Storage) → se guarda en `currentLogoUrl` y en `brandAssets[]` para mostrar en el sidebar
3. `analyzeBrand()` **NO se llama** porque no hubo upload nuevo — la marca ya existía con logo
4. `currentLogoB64` **es `null`** porque no se subió archivo nuevo en esta sesión
5. `brandAssetBlobs` **está vacío** porque no se subió archivo nuevo
6. Por lo tanto: `logoB64 = undefined`
7. En el payload: `logo_b64: undefined` → **El logo NO se manda al backend**

**El logo solo se manda como base64 si el usuario lo subió EN ESTA SESIÓN.** Si la marca ya tenía logo pre-existente (cargado de DB), NO se envía al backend.

**`currentLogoUrl` (la URL de Supabase) NUNCA se incluye en el `GenerationRequest` type** — no hay campo `logo_url` en la interface.

---

## Sección F — Contexto (brief, colores, personalidad)

### F1. Brief / Campaign description

El brief se construye concatenando todos los mensajes del usuario en el chat:

```ts
const userMessages = chatMessages.filter(m => m.role === "user").map(m => m.content);
const campaignDescription = userMessages.join("\n");
```

Se envía en `campaign.description`. Solo incluye los mensajes del user, no las respuestas del agente.

`campaign.tone` y `campaign.extras` se envían siempre como `""` (string vacío). No hay UI para capturar estos campos.

### F2. Colores de la paleta

SÍ se envían, dentro del objeto `brand`:
```ts
primary_color: brand.primary_color,
secondary_color: brand.secondary_color,
accent_color: brand.accent_color,
```

Y también se envía el objeto completo de `brand_vision` que incluye la paleta completa y más datos.

### F3. Personalidad

La personalidad se envía **indirectamente** dentro de `brand_vision`:
```ts
brand_vision: brandVision || null,
```

`brandVision` es el resultado raw del endpoint `/api/v1/brand/analyze-vision`, que incluye `personality` (ej: `"cheerful, friendly, approachable"`).

**Sin embargo**, si `analyzeBrand()` no se ejecutó (marca pre-existente sin upload nuevo), `brandVision` podría ser `null` (si no se guardó en el draft config previamente).

---

## Sección G — Flujo del user documentado

### 1. Entra a `/parrilla/nueva?brand_id=X`

**Estado inicial** (`useParrillaPage.ts` líneas 46-100):
- `includeLogoInImage = false`
- `includeTextInImage = false`
- `posts = []`, `hasGenerated = false`
- `selectedProductIds = []`
- `productImages = []`
- `language = "auto"`
- `objective = "engagement"`
- `platforms = { instagram: true, tiktok: true, linkedin: false, twitter: false }`
- `selectedFormats = new Set(["instagram_feed", "tiktok_video"])`
- `frequency = "3-week"`
- `optionsPerPost = 2`

### 2. Hydration del draft / brand

- Se crea un draft nuevo (`createDraft()`)
- Se llama `loadBrandRow(brandId)` → carga nombre, `logo_url`, colores de la tabla `brands`
- Si el brand tiene logo_url → se muestra en sidebar, `brandDetected = true`
- **`brandVision` queda `null`** (no se analizó — solo se hizo fetch de la row)
- **`currentLogoB64` queda `null`** (no se subió archivo)

### 3. Sube logo (si no había)

- `handleFileUpload()` → lee archivo como base64 → `setCurrentLogoB64(b64)`
- Sube a Supabase Storage → `setCurrentLogoUrl(publicUrl)`
- Llama `analyzeBrand(b64)` → `POST /api/v1/brand/analyze-vision`
- Resultado → `setBrand(newBrand)`, `setBrandVision(a)`, `setBrandDetected(true)`

**Estado actualizado:** `currentLogoB64 = "data:image/..."`, `brandVision = { palette, personality, ... }`

### 4. Chatea con agente

- `sendChatMessage(userMsg)` → `POST /api/v1/chat` con contexto (brand_vision, product_vision, brand_colors)
- Las respuestas del agente NO modifican el brief — el brief es simplemente los mensajes del user concatenados

### 5. Selecciona producto

- **Producto persistente:** Click en `ParrillaProductSelector` → `setSelectedProductIds([productId])`
- **Imagen temporal:** Upload → `setProductImages([b64])` + `analyzeProduct(b64)` → `setProductVision(data)`

### 6. Configura parámetros

- Plataformas, formatos, frecuencia, variantes, objetivo → todo via useState en el hook

### 7. Activa toggles logo + texto

- `setIncludeLogoInImage(true)`, `setIncludeTextInImage(true)`

### 8. Clic en Generar

- `handleGenerateParrilla()` construye `genPayload` y llama `POST /api/v1/posts/generate`
- Payload incluye todos los campos de Sección B

---

## DIAGNÓSTICO FINAL — Hipótesis ordenadas por probabilidad

### 🔴 Hipótesis 1 (ALTA): `logo_b64` es `undefined` cuando brand ya existía

**Archivo:** `src/hooks/useParrillaPage.ts`, líneas 880-884

```ts
let logoB64: string | undefined = currentLogoB64 || undefined;
if (!logoB64 && brandAssetBlobs.length > 0) {
  logoB64 = await blobToBase64(brandAssetBlobs[0]);
}
```

Si la brand ya tenía logo pre-cargado de DB (via `loadBrandRow`), `currentLogoB64` es `null` y `brandAssetBlobs` está vacío. El campo `brand.logo_b64` se envía como `undefined` (omitido en JSON).

**El backend no recibe el logo** → las imágenes generadas no lo integran.

La `GenerationRequest` interface no tiene campo `logo_url` — solo `logo_b64`. No hay fallback para enviar la URL del logo.

### 🔴 Hipótesis 2 (ALTA): `product_images` vacío cuando solo hay productos persistentes

**Archivo:** `src/hooks/useParrillaPage.ts`, línea ~949

```ts
product_images: productImages,         // Solo imágenes temporales (base64)
selected_product_ids: selectedProductIds, // Solo UUIDs
```

Si el usuario solo selecciona productos persistentes (no sube imágenes temporales), `product_images = []`. El backend recibe UUIDs pero necesita resolver las imágenes de la tabla `brand_products`. **Si el backend no resuelve imágenes desde IDs, los posts no tendrán producto visible.**

### 🟡 Hipótesis 3 (MEDIA): `brandVision` es `null` cuando brand fue pre-cargada

**Archivo:** `src/hooks/useParrillaPage.ts`, línea ~951

Si `loadBrandRow()` solo lee nombre/logo/colores pero NO ejecuta `analyzeBrand()`, `brandVision` queda `null`. El backend recibe `brand_vision: null` y pierde contexto sobre personalidad, target audience, suggested scenes, etc.

**Nota:** `brandVision` SÍ se persiste en el draft config (línea ~568: `brandVision`), así que si el usuario había analizado el logo en una sesión anterior, al re-hidratar el draft `applyDraftConfig` restaura `brandVision` desde `cfg.brandVision`.

### 🟡 Hipótesis 4 (MEDIA): `include_logo_in_image` default es `false`

**Archivo:** `src/hooks/useParrillaPage.ts`, línea 97

```ts
const [includeLogoInImage, setIncludeLogoInImage] = useState(false);
```

El default es `false`. Si el usuario NO activa el toggle explícitamente, se manda `false`. Si el user reporta que activó el toggle pero las imágenes no muestran logo, el problema es Hipótesis 1 (logo no se envía como b64) o un bug en el backend.

### 🟢 Hipótesis 5 (BAJA): El backend ignora los campos del payload

Los campos `include_logo_in_image`, `include_text_in_image`, `product_images`, `selected_product_ids` SÍ se envían correctamente en el JSON (verificado en el type `GenerationRequest` y la construcción del payload). Si el backend los ignora, es un bug del backend, no del frontend.

---

## Resumen de gaps confirmados (frontend → backend)

| Dato del user | ¿Llega al payload? | Detalle |
|---|---|---|
| Toggle logo ON | ✅ `include_logo_in_image: true` | Correcto |
| Toggle texto ON | ✅ `include_text_in_image: true` | Correcto |
| Logo de brand existente | ❌ `logo_b64: undefined` | **Solo se manda si se subió EN ESTA SESIÓN** |
| Logo subido ahora | ✅ `logo_b64: "data:image/..."` | Correcto |
| Producto persistente | ✅ `selected_product_ids: [uuid]` | Backend debe resolver las imágenes |
| Imagen temporal de producto | ✅ `product_images: [base64]` | Correcto |
| Colores de marca | ✅ `brand.primary_color` etc. | Correcto |
| Personalidad | ⚠️ `brand_vision: null` si no analizó | Depende de si se subió logo o se hidrató del draft |
| Brief / chat | ✅ `campaign.description` | Solo mensajes del user |
| Tone | ⚠️ `campaign.tone: ""` | Hardcoded vacío, no hay UI |
| Objetivo | ✅ `objective: "engagement"` etc. | Correcto (se envía) |
| Frecuencia | ❌ No se envía como campo | Solo determina cantidad de items en `posts_config` |

---

## Acción recomendada inmediata

1. **Capturar el payload real** — Agregar `console.log` o usar Network tab para confirmar los valores exactos en runtime
2. **Cruzar con el schema del backend** — Verificar qué campos el backend realmente lee y usa para generar imágenes
3. **Confirmar si el backend resuelve `selected_product_ids` → image URLs** — Si no, ahí está el bug del producto
4. **Confirmar si el backend necesita `logo_b64` o puede usar `logo_url`** — Si necesita base64 y el frontend no lo envía para brands pre-existentes, ahí está el bug del logo
