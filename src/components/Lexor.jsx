import { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronLeft, ChevronRight, FileText, Printer, ArrowLeft,
  AlertTriangle, Square, CheckSquare, Wallet, ClipboardList, FileDown,
} from "lucide-react";
import { StatCard, Badge } from "./UI.jsx";
import Espelho from "./Espelho.jsx";
import { PROPOSTAS_LEXOR, ACOES_LEXOR } from "../data/lexor.js";
import { moeda, valorTotal, pendencias, exercicioDe } from "../lexorUtils.js";
import { exportarWord } from "../lexorExport.js";

const PAGE_SIZE = 30;

export default function Lexor() {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("Todas");
  const [acao, setAcao] = useState("Todas");
  const [cmdo, setCmdo] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const [soPendentes, setSoPendentes] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const [espelhosDe, setEspelhosDe] = useState(null); // array de propostas em exibição

  // exercício sugerido pela numeração das propostas, com ajuste manual
  const exercicioPadrao = useMemo(() => {
    const anos = PROPOSTAS_LEXOR.map(exercicioDe).filter(Boolean);
    return anos.length ? Math.max(...anos) : new Date().getFullYear() + 1;
  }, []);
  const [exercicio, setExercicio] = useState(exercicioPadrao);

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
      if (soPendentes && pendencias(p).length === 0) return false;
      if (!termo) return true;
      return [p.nr, p.beneficiario, p.cidade, p.objeto, p.proponente, p.parlamentar, p.acao]
        .some(c => (c || "").toString().toLowerCase().includes(termo));
    });
  }, [busca, uf, acao, cmdo, tipo, soPendentes]);

  useEffect(() => { setPagina(1); }, [busca, uf, acao, cmdo, tipo, soPendentes]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageItems = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const somaFiltrada = useMemo(() => filtradas.reduce((s, p) => s + valorTotal(p), 0), [filtradas]);
  const comPendencia = useMemo(() => filtradas.filter(p => pendencias(p).length > 0).length, [filtradas]);

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
        <StatCard label="Com pendência" value={comPendencia.toLocaleString("pt-BR")}
          sub="impedem a exportação" icon={AlertTriangle} />
      </div>

      <div className="lexor-filtros">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input className="input search-input" placeholder="Buscar por OM, cidade, objeto, autor ou nº…"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="Todos">Tipo de Emenda — todos</option>
          {opcoes.tipos.map(v => <option key={v}>{v}</option>)}
        </select>
        <select className="input" value={uf} onChange={e => setUf(e.target.value)}>
          <option value="Todas">Estados — todos</option>
          {opcoes.ufs.map(v => <option key={v}>{v}</option>)}
        </select>
        <select className="input" value={acao} onChange={e => setAcao(e.target.value)}>
          <option value="Todas">Ação Orçamentária — todas</option>
          {opcoes.acoes.map(v => (
            <option key={v} value={v}>{v}{ACOES_LEXOR[v] ? "" : " (sem cadastro)"}</option>
          ))}
        </select>
        <select className="input" value={cmdo} onChange={e => setCmdo(e.target.value)}>
          <option value="Todos">C Mil A — todos</option>
          {opcoes.cmdos.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div className="lexor-acoes">
        <button className={`chip ${soPendentes ? "chip-active" : ""}`} onClick={() => setSoPendentes(v => !v)}>
          <AlertTriangle size={13} /> Só com pendência
        </button>
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
              <th>Ação</th><th className="esp-right">Valor</th><th>Autor</th><th>Situação</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(p => {
              const probs = pendencias(p);
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
                    {probs.length === 0
                      ? <Badge tone="novo">pronta</Badge>
                      : <span title={probs.join(" · ")}><Badge tone="C">{probs.length} pendência(s)</Badge></span>}
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
              <tr><td colSpan={9} className="empty-row">Nenhuma proposta encontrada com esses filtros.</td></tr>
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
