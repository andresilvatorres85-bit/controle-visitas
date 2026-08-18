import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Isso aparece no console do navegador se o deploy foi feito sem configurar
  // as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (veja o README).
  console.error(
    "Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY " +
      "(no .env local, ou como Secrets do GitHub Actions em produção)."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");
