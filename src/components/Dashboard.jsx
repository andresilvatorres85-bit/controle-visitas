import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { Landmark, Users, BookUser, Plus } from "lucide-react";
import { StatCard } from "./UI.jsx";
import { MESES, PAPEL_LABEL_CURTO, ESP_LABEL, ESP_COR } from "../constants.js";
import { fmtData, todayParts } from "../helpers.js";

export default function Dashboard({ allRecords, novos }) {
  const anosDisponiveis = useMemo(() => {
    const s = new Set(allRecords.map(r => r.y));
    return Array.from(s).sort((a, b) => b - a);
  }, [allRecords]);

  const [ano, setAno] = useState(anosDisponiveis[0] || todayParts().y);

  const registrosDoAno = useMemo(() => allRecords.filter(r => r.y === ano), [allRecords, ano]);
  const registrosAnoAnterior = useMemo(() => allRecords.filter(r => r.y === ano - 1), [allRecords, ano]);

  const totalGeral = allRecords.length;
  const totalAno = registrosDoAno.length;
  const hoje = todayParts();
  const totalMes = allRecords.filter(r => r.y === hoje.y && r.m === hoje.m).length;

  const evolucaoMensal = useMemo(() => {
    const arr = [];
    for (let m = 1; m <= 12; m++) {
      arr.push({
        mes: MESES[m],
        [String(ano)]: registrosDoAno.filter(r => r.m === m).length,
        [String(ano - 1)]: registrosAnoAnterior.filter(r => r.m === m).length,
      });
    }
    return arr;
  }, [registrosDoAno, registrosAnoAnterior, ano]);

  const porPapel = useMemo(() => {
    const ordem = ["S", "AS", "D", "AD", "C", "AE"];
    return ordem.map(code => ({
      papel: PAPEL_LABEL_CURTO[code],
      total: registrosDoAno.filter(r => r.role === code).length,
    }));
  }, [registrosDoAno]);

  const porEspectro = useMemo(() => {
    const ordem = ["E", "D", "C"];
    return ordem.map(code => ({
      espectro: ESP_LABEL[code],
      total: registrosDoAno.filter(r => r.esp === code).length,
      cor: code,
    }));
  }, [registrosDoAno]);

  const ultimosNovos = useMemo(
    () => [...novos].sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0)).slice(0, 6),
    [novos]
  );

  return (
    <div className="view-pad">
      <div className="dash-header">
        <div>
          <h1 className="page-title">Painel de contatos parlamentares</h1>
          <p className="page-sub">Consolidado de visitas e reuniões da subassessoria de orçamento</p>
        </div>
        <select className="input select-year" value={ano} onChange={e => setAno(Number(e.target.value))}>
          {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="stat-grid">
        <StatCard label="Total geral (desde mai/24)" value={totalGeral.toLocaleString("pt-BR")} icon={BookUser} />
        <StatCard label={`Total em ${ano}`} value={totalAno.toLocaleString("pt-BR")} icon={Landmark} />
        <StatCard label="Neste mês" value={totalMes.toLocaleString("pt-BR")} icon={Users} />
        <StatCard label="Lançados neste app" value={novos.length.toLocaleString("pt-BR")} sub={novos.length ? "desde a implantação" : "nenhum ainda"} icon={Plus} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Evolução mensal — {ano} vs {ano - 1}</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolucaoMensal} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={String(ano - 1)} fill="var(--muted-bar)" radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey={String(ano)} fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head"><h2 className="panel-title">Por função — {ano}</h2></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porPapel} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="papel" tick={{ fontSize: 12, fill: "var(--ink)" }} axisLine={false} tickLine={false} width={92} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }} />
                <Bar dataKey="total" fill="var(--brand)" radius={[0, 3, 3, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2 className="panel-title">Por espectro — {ano}</h2></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porEspectro} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="espectro" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }} />
                <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  {porEspectro.map((entry, i) => <Cell key={i} fill={ESP_COR[entry.cor]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {ultimosNovos.length > 0 && (
        <div className="panel">
          <div className="panel-head"><h2 className="panel-title">Últimos lançamentos no app</h2></div>
          <ul className="recent-list">
            {ultimosNovos.map(r => (
              <li key={r.id} className="recent-item">
                <span className="recent-stamp">{r.protocolo}</span>
                <span className="recent-name">{r.n}</span>
                <span className="recent-meta">{r.p || "—"} · {fmtData(r)}</span>
                <span className="recent-author">{r.autor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
