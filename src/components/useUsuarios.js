import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { USUARIOS_SEED } from "../data/usuariosSeed.js";

// Carrega a lista de usuários (nome + e-mail de login). Na primeira execução,
// se a tabela estiver vazia, semeia com os nomes que já existiam no app.
export function useUsuarios(session) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase.from("usuarios").select("*").order("nome", { ascending: true });
    if (error) { setCarregado(true); return; }

    if ((data || []).length === 0) {
      const { data: inserted } = await supabase.from("usuarios").insert(USUARIOS_SEED).select().order("nome", { ascending: true });
      setUsuarios(inserted || []);
    } else {
      setUsuarios(data);
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    recarregar();
    const channel = supabase
      .channel("usuarios-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, () => recarregar())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session, recarregar]);

  return { usuarios, carregado, recarregar };
}

// Dado o e-mail logado, encontra o nome cadastrado (case-insensitive).
// Se não houver associação, devolve null.
export function nomePorEmail(usuarios, email) {
  if (!email) return null;
  const alvo = email.trim().toLowerCase();
  const u = usuarios.find(x => (x.email || "").trim().toLowerCase() === alvo);
  return u ? u.nome : null;
}
