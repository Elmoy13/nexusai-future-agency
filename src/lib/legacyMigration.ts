/**
 * One-shot migration: limpia las claves obsoletas de localStorage
 * (logos en base64, brand profiles, brand names por parrilla).
 *
 * Ya NO subimos los logos viejos a Storage automáticamente: como no sabemos
 * a qué brand_id real corresponden (las keys usaban el id de la parrilla,
 * no el de la marca), simplemente liberamos espacio. El usuario puede
 * re-subir el logo desde la marca cuando quiera.
 *
 * Se ejecuta UNA SOLA vez por dispositivo (flag `migration_v2_done`).
 */

const FLAG = "migration_v2_done";
const LEGACY_PREFIXES = ["brand_logo_", "brand_profile_", "brand_name_", "presentation_draft_"];

export function runLegacyLocalStorageMigration() {
  try {
    if (localStorage.getItem(FLAG) === "1") return;

    const keys = Object.keys(localStorage);
    let removed = 0;
    for (const key of keys) {
      if (LEGACY_PREFIXES.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
        removed++;
      }
    }

    localStorage.setItem(FLAG, "1");
    if (removed > 0) {
      console.info(`[migration_v2] cleaned ${removed} legacy localStorage entries`);
    }
  } catch (err) {
    console.warn("[migration_v2] failed", err);
  }
}
