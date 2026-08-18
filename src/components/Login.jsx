import { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function Login({ bgImage }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setCarregando(false);
  }

  return (
    <div className="login-screen">
      {bgImage && <div className="login-bg" style={{ backgroundImage: `url(${bgImage})` }} />}
      <div className="login-card">
        <div className="login-mark">A4.6</div>
        <h1 className="login-title">Controle de Visitas/Contatos</h1>
        <p className="login-sub">A4.6 - Subassessoria de Orçamento. Entre com a conta da equipe para lançar e consultar contatos.</p>
        <form className="login-form" onSubmit={entrar}>
          <label className="field">
            <span className="field-label">E-mail</span>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </label>
          <label className="field">
            <span className="field-label">Senha</span>
            <input className="input" type="password" required value={senha} onChange={e => setSenha(e.target.value)} />
          </label>
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="login-actions">
            <button className="btn btn-primary" type="submit" disabled={carregando}>
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
