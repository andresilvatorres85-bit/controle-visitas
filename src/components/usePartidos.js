import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { PARTIDOS_SEED } from "../data/partidosSeed.js";

// Carrega a lista de partidos do Supabase. Na primeira execução, se a tabela
// estiver vazia, semeia com os partidos vindos da planilha original.
export function usePartidos(session) {
  const [partidos, setPartidos] = useState([]);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase.from("partidos").select("*").order("sigla", { ascending: true });
    if (error) { setCarregado(true); return; }

    if ((data || []).length === 0) {
      // tabela vazia — semeia com os dados da planilha
      const seed = PARTIDOS_SEED.map(p => ({ sigla: p.sigla, nome: p.nome, espectro: p.esp }));
      const { data: inserted } = await supabase.from("partidos").insert(seed).select().order("sigla", { ascending: true });
      setPartidos(inserted || []);
    } else {
      setPartidos(data);
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    recarregar();
    const channel = supabase
      .channel("partidos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "partidos" }, () => recarregar())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session, recarregar]);

  // mapa sigla(maiúscula) -> espectro, para preenchimento automático no lançamento
  const mapaEspectro = {};
  for (const p of partidos) mapaEspectro[p.sigla.toUpperCase()] = p.espectro;

  return { partidos, mapaEspectro, carregado, recarregar };
}
