import { useState } from "react";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Field, Badge } from "./UI.jsx";
import { ESP_LABEL } from "../constants.js";
import { supabase } from "../lib/supabaseClient.js";

// Conteúdo de gestão de partidos (usado dentro da aba Configurações).
export default function PartidosPanel({ partidos }) {
  const [sigla, setSigla] = useState("");
  const [nome, setNome] = useState("");
  const [esp, setEsp] = useState("C");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editEsp, setEditEsp] = useState("C");
  const [editNome, setEditNome] = useState("");

  async function adicionar(e) {
    e.preventDefault();
    setErro("");
    if (!sigla.trim()) { setErro("Informe a sigla do partido."); return; }
    const sig = sigla.trim().toUpperCase();
    if (partidos.some(p => p.sigla.toUpperCase() === sig)) {
      setErro("Já existe um partido com essa sigla."); return;
    }
    setSalvando(true);
    const { error } = await supabase.from("partidos").insert({ sigla: sig, nome: nome.trim() || sig, espectro: esp });
    setSalvando(false);
    if (error) { setErro("Não foi possível salvar: " + error.message); return; }
    setSigla(""); setNome(""); setEsp("C");
  }

  async function excluir(id) { await supabase.from("partidos").delete().eq("id", id); }

  function iniciarEdicao(p) { setEditId(p.id); setEditEsp(p.espectro); setEditNome(p.nome); }

  async function salvarEdicao(id) {
    await supabase.from("partidos").update({ espectro: editEsp, nome: editNome.trim() }).eq("id", id);
    setEditId(null);
  }

  const ordenados = [...partidos].sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"));

  return (
    <div>
      <p className="config-help">Estes partidos preenchem o espectro automaticamente nos lançamentos de Senador e Deputado.</p>

      <form className="partido-form" onSubmit={adicionar}>
        <Field label="Sigla" required>
          <input className="input" value={sigla} onChange={e => setSigla(e.target.value)} placeholder="Ex.: PL" />
        </Field>
        <Field label="Nome do partido">
          <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Partido Liberal" />
        </Field>
        <Field label="Espectro" required>
          <select className="input" value={esp} onChange={e => setEsp(e.target.value)}>
            <option value="E">Esquerda</option>
            <option value="D">Direita</option>
            <option value="C">Centro</option>
          </select>
        </Field>
        <button className="btn btn-primary btn-sm" type="submit" disabled={salvando}>
          <Plus size={15} /> Adicionar
        </button>
      </form>
      {erro && <div className="alert alert-error" style={{ marginTop: 8 }}>{erro}</div>}

      <div className="partido-count">{ordenados.length} partidos cadastrados</div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Sigla</th><th>Nome</th><th>Espectro</th><th></th></tr>
          </thead>
          <tbody>
            {ordenados.map(p => (
              <tr key={p.id}>
                <td className="mono" style={{ fontWeight: 600 }}>{p.sigla}</td>
                <td>{editId === p.id ? <input className="input" value={editNome} onChange={e => setEditNome(e.target.value)} /> : p.nome}</td>
                <td>
                  {editId === p.id ? (
                    <select className="input" value={editEsp} onChange={e => setEditEsp(e.target.value)} style={{ maxWidth: 140 }}>
                      <option value="E">Esquerda</option>
                      <option value="D">Direita</option>
                      <option value="C">Centro</option>
                    </select>
                  ) : <Badge tone={p.espectro}>{ESP_LABEL[p.espectro]}</Badge>}
                </td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  {editId === p.id ? (
                    <>
                      <button className="icon-btn edit" title="Salvar" onClick={() => salvarEdicao(p.id)}><Check size={15} /></button>
                      <button className="icon-btn" title="Cancelar" onClick={() => setEditId(null)}><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <button className="icon-btn edit" title="Editar" onClick={() => iniciarEdicao(p)}><Pencil size={14} /></button>
                      <button className="icon-btn" title="Excluir" onClick={() => excluir(p.id)}><Trash2 size={14} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
