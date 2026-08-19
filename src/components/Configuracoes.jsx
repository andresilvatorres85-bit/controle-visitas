import { useState } from "react";
import { ChevronDown, ChevronRight, Landmark, UsersRound } from "lucide-react";
import PartidosPanel from "./PartidosPanel.jsx";
import Usuarios from "./Usuarios.jsx";

// Aba de Configurações: reúne duas seções recolhíveis — "Partidos e espectro"
// e "Usuários". Ambas iniciam recolhidas (retraídas) ao abrir a aba.
export default function Configuracoes({ partidos, usuarios, emailAtual }) {
  const [aberta, setAberta] = useState(null); // null = todas retraídas

  function toggle(secao) {
    setAberta(prev => (prev === secao ? null : secao));
  }

  return (
    <div className="view-pad">
      <h1 className="page-title">Configurações</h1>
      <p className="page-sub">Gerencie os partidos e os usuários do aplicativo.</p>

      <div className="config-section">
        <button className="config-header" onClick={() => toggle("partidos")}>
          {aberta === "partidos" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Landmark size={17} strokeWidth={1.75} />
          <span className="config-title">Partidos e espectro</span>
          <span className="config-badge">{partidos.length}</span>
        </button>
        {aberta === "partidos" && (
          <div className="config-body">
            <PartidosPanel partidos={partidos} />
          </div>
        )}
      </div>

      <div className="config-section">
        <button className="config-header" onClick={() => toggle("usuarios")}>
          {aberta === "usuarios" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <UsersRound size={17} strokeWidth={1.75} />
          <span className="config-title">Usuários</span>
          <span className="config-badge">{usuarios.length}</span>
        </button>
        {aberta === "usuarios" && (
          <div className="config-body">
            <Usuarios usuarios={usuarios} emailAtual={emailAtual} />
          </div>
        )}
      </div>
    </div>
  );
}
