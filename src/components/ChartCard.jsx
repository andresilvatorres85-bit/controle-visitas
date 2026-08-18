import { useRef, useState } from "react";
import { FileDown, Image as ImageIcon } from "lucide-react";
import { exportarGraficoPptx, exportarGraficoPng } from "../exportUtils.js";

// Envolve cada gráfico do painel, adicionando no canto superior direito os
// botões "PPTX" (exporta aquele gráfico como slide nativo editável) e "PNG"
// (exporta a imagem do gráfico renderizado).
export default function ChartCard({ titulo, tipo, dadosExport, filtros, children }) {
  const ref = useRef(null);
  const [ocupado, setOcupado] = useState(false);

  async function pptx() {
    setOcupado(true);
    try {
      await exportarGraficoPptx({ tipo, titulo, dados: dadosExport, ...filtros });
    } catch (e) {
      console.error("Falha ao exportar PPTX:", e);
    }
    setOcupado(false);
  }

  async function png() {
    setOcupado(true);
    try {
      await exportarGraficoPng(ref.current, titulo.replace(/[^\w]+/g, "_"));
    } catch (e) {
      console.error("Falha ao exportar PNG:", e);
    }
    setOcupado(false);
  }

  return (
    <div className="panel" ref={ref}>
      <div className="panel-title-row">
        <h2 className="panel-title">{titulo}</h2>
        <div className="chart-actions no-export">
          <button className="mini-btn" onClick={pptx} disabled={ocupado} title="Exportar este gráfico em PowerPoint editável">
            <FileDown size={13} /> PPTX
          </button>
          <button className="mini-btn" onClick={png} disabled={ocupado} title="Exportar este gráfico como imagem PNG">
            <ImageIcon size={13} /> PNG
          </button>
        </div>
      </div>
      <div className="chart-wrap">{children}</div>
    </div>
  );
}
