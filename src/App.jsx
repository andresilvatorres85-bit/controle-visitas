import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, LayoutDashboard, History, Check, X, LogOut, Landmark } from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";
import { HISTORICO_DATA } from "./data/historico.js";
import { usePartidos } from "./components/usePartidos.js";
import bgImage from "./bg.jpg";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import NovoRegistro from "./components/NovoRegistro.jsx";
import Historico from "./components/Historico.jsx";
import Partidos from "./components/Partidos.jsx";

// Converte uma linha da tabela "registros" (Supabase) para o formato interno
// enxuto usado pelos componentes (mesmas chaves do histórico da planilha).
function mapDbRow(row) {
  return {
    id: row.id,
    d: row.dia, m: row.mes, y: row.ano,
    f: row.funcao, n: row.nome, p: row.partido, uf: row.uf,
    role: row.papel, esp: row.espectro, assunto: row.assunto,
    autor: row.autor, protocolo: row.protocolo,
    criadoEm: row.criado_em ? new Date(row.criado_em).getTime() : null,
  };
}

const NAV = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "novo", label: "Lançar", icon: Plus },
  { id: "historico", label: "Histórico", icon: History },
  { id: "partidos", label: "Partidos", icon: Landmark },
];

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado
  const [view, setView] = useState("dashboard");
  const [novos, setNovos] = useState([]);
  const [loadedNovos, setLoadedNovos] = useState(false);
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(true);

  const { partidos, mapaEspectro, carregado: partidosCarregados } = usePartidos(session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const carregarNovos = useCallback(async () => {
    const { data, error } = await supabase.from("registros").select("*").order("criado_em", { ascending: true });
    if (error) { setOnline(false); return; }
    setOnline(true);
    setNovos((data || []).map(mapDbRow));
    setLoadedNovos(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    carregarNovos();
    const channel = supabase
      .channel("registros-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "registros" }, () => carregarNovos())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session, carregarNovos]);

  const handleSaved = useCallback((row) => {
    setToast({ tipo: "ok", msg: `Contato registrado — protocolo ${row.protocolo}` });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleDelete = useCallback(async (id) => {
    const { error } = await supabase.from("registros").delete().eq("id", id);
    if (error) {
      setToast({ tipo: "erro", msg: "Não foi possível excluir." });
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const allRecords = useMemo(() => {
    const hist = HISTORICO_DATA.map(r => ({ ...r, origem: "historico" }));
    const nov = novos.map(r => ({ ...r, origem: "novo" }));
    return [...hist, ...nov];
  }, [novos]);

  const nextProtocolo = novos.length + 1;

  if (session === undefined) {
    return <div className="login-loading">Carregando…</div>;
  }
  if (session === null) {
    return <Login bgImage={bgImage} />;
  }

  return (
    <div className="app-shell">
      <div className="app-bg" style={{ backgroundImage: `url(${bgImage})` }} />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A4.6</span>
          <div className="brand-text">
            <span className="brand-title">CONTROLE DE VISITAS/CONTATOS</span>
            <span className="brand-sub">A4.6 - Subassessoria de Orçamento</span>
          </div>
        </div>
        <div className="topbar-right">
          <nav className="topnav">
            {NAV.map(n => (
              <button key={n.id} className={`topnav-btn ${view === n.id ? "topnav-btn-active" : ""}`} onClick={() => setView(n.id)}>
                <n.icon size={15} strokeWidth={1.75} /> {n.label}
              </button>
            ))}
          </nav>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()} title="Sair">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="main">
        {!loadedNovos || !partidosCarregados ? (
          <div className="loading-state">Carregando…</div>
        ) : view === "dashboard" ? (
          <Dashboard allRecords={allRecords} novos={novos} />
        ) : view === "novo" ? (
          <NovoRegistro onSaved={handleSaved} nextProtocolo={nextProtocolo} partidos={partidos} mapaEspectro={mapaEspectro} />
        ) : view === "historico" ? (
          <Historico allRecords={allRecords} onDelete={handleDelete} />
        ) : (
          <Partidos partidos={partidos} />
        )}
      </main>

      <nav className="bottomnav">
        {NAV.map(n => (
          <button key={n.id} className={`bottomnav-btn ${view === n.id ? "bottomnav-btn-active" : ""}`} onClick={() => setView(n.id)}>
            <n.icon size={19} strokeWidth={1.75} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className={`toast toast-${toast.tipo}`}>
          {toast.tipo === "ok" ? <Check size={15} /> : <X size={15} />} {toast.msg}
        </div>
      )}
      {!online && <div className="toast toast-erro">Sem conexão com o servidor — verifique sua internet.</div>}
    </div>
  );
}
