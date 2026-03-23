import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://klxdelvimqpjgbxuznyj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zccLNmYng5e8m6cVAE60nA_yxpNCEzM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
