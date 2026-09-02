import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, FileText, Printer, ArrowLeft,
  AlertTriangle, Square, CheckSquare, Wallet, ClipboardList, FileDown, UserCheck,
} from "lucide-react";
import { StatCard, Badge } from "./UI.jsx";
import Espelho from "./Espelho.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { PROPOSTAS_LEXOR, ACOES_LEXOR } from "../data/lexor.js";
import {
  moeda, valorTotal, pendencias, exercicioDe,
  situacaoDe, SITUACOES, STATUS_LEXOR, STATUS_LEXOR_PADRAO,
} from "../lexorUtils.js";
import { exportarWord } from "../lexorExport.js";

const PAGE_SIZE = 30;

export default function Lexor() {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("Todas");
  const [acao, setAcao] = useState("Todas");
  const [cmdo, setCmdo] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const [situacao, setSituacao] = useState("Todas");
  const [statusLexor, setStatusLexor] = useState({});   // { nr: 'Confeccionado' }
  const [salvando, setSalvando] = useState(null);
  const [erroStatus, setErroStatus] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const [espelhosDe, setEspelhosDe] = useState(null); // array de propostas em exibição

  // exercício sugerido pela numeração das propostas, com ajuste manual
  const exercicioPadrao = useMemo(() => {
    const anos = PROPOSTAS_LEXOR.map(exercicioDe).filter(Boolean);
    return anos.length ? Math.max(...anos) : new Date().getFullYear() + 1;
  }, []);
  const [exercicio, setExercicio] = useState(exercicioPadrao);

  // Status da coluna LEXOR: carregado do Supabase e mantido em tempo real,
  // para que Maj Tiago, Maj Torres e ST Bacchiega vejam a mesma tramitação.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data, error } = await supabase.from("lexor_status").select("nr,status");
      if (!vivo) return;
      if (error) { setErroStatus(true); return; }
      setStatusLexor(Object.fromEntries(data.map(r => [r.nr, r.status])));
    })();
    const canal = supabase
      .channel("lexor_status_stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "lexor_status" }, payload => {
        const linha = payload.new || payload.old;
        if (!linha) return;
        setStatusLexor(prev => ({ ...prev, [linha.nr]: payload.new?.status || STATUS_LEXOR_PADRAO }));
      })
      .subscribe();
    return () => { vivo = false; supabase.removeChannel(canal); };
  }, []);

  const mudarStatus = useCallback(async (nr, novo) => {
    const anterior = statusLexor[nr] || STATUS_LEXOR_PADRAO;
    setStatusLexor(prev => ({ ...prev, [nr]: novo }));   // resposta imediata na tela
    setSalvando(nr);
    const { data: sessao } = await supabase.auth.getUser();
    const { error } = await supabase.from("lexor_status").upsert({
      nr,
      status: novo,
      atualizado_por: sessao?.user?.email || null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "nr" });
    setSalvando(null);
    if (error) {
      setStatusLexor(prev => ({ ...prev, [nr]: anterior }));   // desfaz se falhou
      setErroStatus(true);
    }
  }, [statusLexor]);

  const opcoes = useMemo(() => {
    const ufs = new Set(), acoes = new Set(), cmdos = new Set(), tipos = new Set();
    for (const p of PROPOSTAS_LEXOR) {
      if (p.uf) ufs.add(p.uf);
      if (p.acao) acoes.add(p.acao);
      if (p.cmdo) cmdos.add(p.cmdo);
      if (p.tipo) tipos.add(p.tipo);
    }
    return {
      ufs: [...ufs].sort(),
      acoes: [...acoes].sort(),
      cmdos: [...cmdos].sort(),
      tipos: [...tipos].sort(),
    };
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return PROPOSTAS_LEXOR.filter(p => {
      if (uf !== "Todas" && p.uf !== uf) return false;
      if (acao !== "Todas" && p.acao !== acao) return false;
      if (cmdo !== "Todos" && p.cmdo !== cmdo) return false;
      if (tipo !== "Todos" && p.tipo !== tipo) return false;
      if (situacao !== "Todas" && situacaoDe(p) !== situacao) return false;
      if (!termo) return true;
      return [p.nr, p.beneficiario, p.cidade, p.objeto, p.proponente, p.parlamentar, p.acao]
        .some(c => (c || "").toString().toLowerCase().includes(termo));
    });
  }, [busca, uf, acao, cmdo, tipo, situacao]);

  useEffect(() => { setPagina(1); }, [busca, uf, acao, cmdo, tipo, situacao]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageItems = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const somaFiltrada = useMemo(() => filtradas.reduce((s, p) => s + valorTotal(p), 0), [filtradas]);
  const prospectadas = useMemo(
    () => filtradas.filter(p => situacaoDe(p) === "prospectada").length, [filtradas]);

  function alternar(nr) {
    setSelecionadas(prev => {
      const s = new Set(prev);
      s.has(nr) ? s.delete(nr) : s.add(nr);
      return s;
    });
  }

  function alternarPagina() {
    const todosNaPagina = pageItems.every(p => selecionadas.has(p.nr));
    setSelecionadas(prev => {
      const s = new Set(prev);
      for (const p of pageItems) todosNaPagina ? s.delete(p.nr) : s.add(p.nr);
      return s;
    });
  }

  function abrirSelecionadas() {
    const lista = filtradas.filter(p => selecionadas.has(p.nr));
    if (lista.length) setEspelhosDe(lista);
  }

  // ---------------------------------------------------------------- espelhos
  if (espelhosDe) {
    const nomeArquivo = espelhosDe.length === 1
      ? `espelho-${espelhosDe[0].nr}`
      : `espelhos-lexor-${exercicio}`;
    return (
      <div className="view-pad lexor-espelhos">
        <div className="espelho-barra no-print">
          <button className="btn btn-ghost btn-sm" onClick={() => setEspelhosDe(null)}>
            <ArrowLeft size={15} /> Voltar à lista
          </button>
          <span className="page-info">
            {espelhosDe.length === 1
              ? `Proposta ${espelhosDe[0].nr}`
              : `${espelhosDe.length} espelhos`} · exercício {exercicio}
          </span>
          <div className="espelho-barra-acoes">
            <button className="btn btn-ghost btn-sm" onClick={() => exportarWord(nomeArquivo)}>
              <FileDown size={15} /> Word
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} /> PDF
            </button>
          </div>
        </div>

        <div className="espelho-area">
          {espelhosDe.map(p => (
            <Espelho key={p.nr} proposta={p} exercicio={exercicio} />
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------- lista
  return (
    <div className="view-pad">
      <h1 className="page-title">Espelhos de emenda — LEXOR</h1>
      <p className="page-sub">
        {PROPOSTAS_LEXOR.length.toLocaleString("pt-BR")} propostas do Controle_LEXOR.
        Selecione uma ou várias e gere os espelhos no formato oficial.
      </p>

      <div className="stat-grid stat-grid-3">
        <StatCard label="Propostas no filtro" value={filtradas.length.toLocaleString("pt-BR")}
          sub={`de ${PROPOSTAS_LEXOR.length.toLocaleString("pt-BR")} no total`} icon={ClipboardList} />
        <StatCard label="Valor somado" value={`R$ ${moeda(somaFiltrada)}`}
          sub="GND 3 + GND 4" icon={Wallet} />
        <StatCard label="Prospectadas" value={prospectadas.toLocaleString("pt-BR")}
          sub="com parlamentar autor" icon={UserCheck} />
      </div>

      <div className="lexor-filtros">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input className="input search-input" placeholder="Buscar por OM, cidade, objeto, autor ou nº…"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className={`input ${tipo === "Todos" ? "input-marca" : ""}`}
          value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="Todos">Tipo de Emenda</option>
          {opcoes.tipos.map(v => <option key={v}>{v}</option>)}
        </select>
        <select className={`input ${uf === "Todas" ? "input-marca" : ""}`}
          value={uf} onChange={e => setUf(e.target.value)}>
          <option value="Todas">Estados</option>
          {opcoes.ufs.map(v => <option key={v}>{v}</option>)}
        </select>
        <select className={`input ${acao === "Todas" ? "input-marca" : ""}`}
          value={acao} onChange={e => setAcao(e.target.value)}>
          <option value="Todas">Ação Orçamentária</option>
          {opcoes.acoes.map(v => (
            <option key={v} value={v}>{v}{ACOES_LEXOR[v] ? "" : " (sem cadastro)"}</option>
          ))}
        </select>
        <select className={`input ${cmdo === "Todos" ? "input-marca" : ""}`}
          value={cmdo} onChange={e => setCmdo(e.target.value)}>
          <option value="Todos">C Mil A</option>
          {opcoes.cmdos.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div className="lexor-acoes">
        <div className="lexor-situacoes">
          {["Todas", "prospectada", "nao_prospectada", "pendencia"].map(chave => (
            <button key={chave}
              className={`chip ${situacao === chave ? "chip-active" : ""}`}
              onClick={() => setSituacao(chave)}>
              {chave === "pendencia" && <AlertTriangle size={13} />}
              {chave === "Todas" ? "Todas" : SITUACOES[chave].rotulo}
            </button>
          ))}
        </div>
        <label className="lexor-exercicio">
          Exercício
          <input className="input" type="number" min="2020" max="2099" value={exercicio}
            onChange={e => setExercicio(Number(e.target.value))} />
        </label>
        <div className="lexor-acoes-dir">
          <span className="page-info">{selecionadas.size} selecionada(s)</span>
          <button className="btn btn-primary btn-sm" disabled={selecionadas.size === 0} onClick={abrirSelecionadas}>
            <FileText size={15} /> Gerar espelhos
          </button>
        </div>
      </div>

      {erroStatus && (
        <div className="lexor-aviso-erro">
          A coluna LEXOR não pôde ser lida ou gravada. Rode o script
          <code> supabase_lexor_status.sql </code> no SQL Editor do Supabase para criar a tabela.
        </div>
      )}

      <div className="table-wrap">
        <table className="tbl tbl-lexor">
          <thead>
            <tr>
              <th className="col-check">
                <button className="icon-btn" onClick={alternarPagina} title="Selecionar a página">
                  {pageItems.length > 0 && pageItems.every(p => selecionadas.has(p.nr))
                    ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>
              </th>
              <th>Nº</th><th>Beneficiário</th><th>Município / UF</th>
              <th>Ação</th><th className="esp-right">Valor</th><th>Autor</th>
              <th>Situação</th><th>LEXOR</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(p => {
              const probs = pendencias(p);
              const sit = situacaoDe(p);
              const status = statusLexor[p.nr] || STATUS_LEXOR_PADRAO;
              return (
                <tr key={p.nr} className={selecionadas.has(p.nr) ? "row-sel" : ""}>
                  <td className="col-check">
                    <button className="icon-btn" onClick={() => alternar(p.nr)}>
                      {selecionadas.has(p.nr) ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="mono">{p.nr}</td>
                  <td className="cel-benef">{p.beneficiario || <span className="muted">sem beneficiário</span>}</td>
                  <td>{p.cidade || "—"} <span className="mono">{p.uf || ""}</span></td>
                  <td className="mono">{p.acao || "—"}</td>
                  <td className="mono esp-right">{moeda(valorTotal(p))}</td>
                  <td>{p.parlamentar ? `${p.parlamentar}${p.partido ? ` (${p.partido})` : ""}` : <span className="muted">a definir</span>}</td>
                  <td>
                    <span title={probs.length ? probs.join(" · ") : undefined}>
                      <Badge tone={SITUACOES[sit].tone}>{SITUACOES[sit].rotulo}</Badge>
                    </span>
                  </td>
                  <td>
                    <select className={`select-status status-${status.toLowerCase()}`}
                      value={status} disabled={erroStatus}
                      onChange={e => mudarStatus(p.nr, e.target.value)}>
                      {STATUS_LEXOR.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {salvando === p.nr && <span className="salvando">salvando…</span>}
                  </td>
                  <td>
                    <button className="icon-btn edit" title="Ver espelho" onClick={() => setEspelhosDe([p])}>
                      <FileText size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr><td colSpan={10} className="empty-row">Nenhuma proposta encontrada com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="icon-btn" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}><ChevronLeft size={16} /></button>
        <span className="page-info">Página {pagina} de {totalPaginas} · {filtradas.length.toLocaleString("pt-BR")} propostas</span>
        <button className="icon-btn" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
