import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "./UI.jsx";
import { MESES_LONGO, PAPEL_LABEL, PAPEL_LABEL_CURTO, ESP_LABEL } from "../constants.js";
import { fmtData, chaveOrdenacao } from "../helpers.js";

const PAGE_SIZE = 40;

export default function Historico({ allRecords, onDelete }) {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("Todos");
  const [mes, setMes] = useState("Todos");
  const [papel, setPapel] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  const anosDisponiveis = useMemo(() => {
    const s = new Set(allRecords.map(r => r.y));
    return Array.from(s).sort((a, b) => b - a);
  }, [allRecords]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return allRecords
      .filter(r => ano === "Todos" || r.y === Number(ano))
      .filter(r => mes === "Todos" || r.m === Number(mes))
      .filter(r => papel === "Todos" || r.role === papel)
      .filter(r => !termo || r.n.toLowerCase().includes(termo) || (r.p || "").toLowerCase().includes(termo))
      .sort((a, b) => chaveOrdenacao(b) - chaveOrdenacao(a));
  }, [allRecords, busca, ano, mes, papel]);

  useEffect(() => { setPagina(1); }, [busca, ano, mes, papel]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageItems = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  return (
    <div className="view-pad">
      <h1 className="page-title">Histórico de contatos</h1>
      <p className="page-sub">{allRecords.length.toLocaleString("pt-BR")} registros — planilha original + lançamentos do app.</p>

      <div className="filters">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input className="input search-input" placeholder="Buscar por nome ou partido…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="input" value={ano} onChange={e => setAno(e.target.value)}>
          <option>Todos</option>
          {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="input" value={mes} onChange={e => setMes(e.target.value)}>
          <option>Todos</option>
          {MESES_LONGO.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" value={papel} onChange={e => setPapel(e.target.value)}>
          <option value="Todos">Todas as funções</option>
          {Object.entries(PAPEL_LABEL).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Data</th><th>Nome</th><th>Partido / Órgão</th><th>UF</th>
              <th>Função</th><th>Espectro / Assunto</th><th>Origem</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(r => (
              <tr key={r.id}>
                <td className="mono">{fmtData(r)}</td>
                <td>{r.n}</td>
                <td>{r.p || "—"}</td>
                <td className="mono">{r.uf || "—"}</td>
                <td>{r.role ? PAPEL_LABEL_CURTO[r.role] : <span className="muted">não categorizado</span>}</td>
                <td>
                  {r.role === "AE"
                    ? (r.assunto ? <Badge tone="aspar">{r.assunto}</Badge> : "—")
                    : (r.esp ? <Badge tone={r.esp}>{ESP_LABEL[r.esp]}</Badge> : "—")}
                </td>
                <td>
                  {r.origem === "novo"
                    ? <Badge tone="novo">app · {r.autor}</Badge>
                    : <Badge tone="hist">planilha</Badge>}
                </td>
                <td>
                  {r.origem === "novo" && (
                    <button className="icon-btn" title="Excluir lançamento" onClick={() => onDelete(r.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={8} className="empty-row">Nenhum registro encontrado com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="icon-btn" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}><ChevronLeft size={16} /></button>
        <span className="page-info">Página {pagina} de {totalPaginas} · {filtrados.length.toLocaleString("pt-BR")} registros</span>
        <button className="icon-btn" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
