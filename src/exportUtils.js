import { ESP_LABEL, PAPEL_LABEL_CURTO, MESES } from "./constants.js";

// pptxgenjs e html-to-image são pesados e só usados na exportação; carregamos
// sob demanda (dynamic import) para não pesar o carregamento inicial do app.
async function getPptx() {
  const mod = await import("pptxgenjs");
  return mod.default;
}
async function getToPng() {
  const mod = await import("html-to-image");
  return mod.toPng;
}

// Paleta usada nos slides (coerente com o tema do app, porém sobre fundo claro do PPT)
const COR = {
  brand: "2B5D45",
  esq: "A6433C",
  dir: "33578C",
  cen: "B0862E",
  ink: "1C2620",
  muted: "6B7568",
  gold: "8A6D3B",
  anos: ["2B5D45", "8A6D3B", "33578C", "A6433C", "6B7568", "B0862E"],
};

function rotuloAnos(anos) {
  const arr = [...anos].sort((a, b) => a - b);
  return arr.join(" · ");
}

function subtituloFiltros({ anos, mes, papel }) {
  const partes = [`Anos: ${rotuloAnos(anos)}`];
  if (mes && mes !== "Todos") partes.push(`Mês: ${mes}`);
  if (papel && papel !== "Todos") partes.push(`Função: ${papel}`);
  return partes.join("   |   ");
}

// Slide-mestre com cabeçalho institucional
function aplicarBase(slide, pptx, titulo, subtitulo) {
  slide.background = { color: "F4F6F1" };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.9, fill: { color: "16211B" } });
  slide.addText(titulo, { x: 0.4, y: 0.12, w: 9.2, h: 0.45, fontSize: 22, bold: true, color: "FFFFFF", fontFace: "Georgia" });
  slide.addText(subtitulo || "", { x: 0.4, y: 0.56, w: 9.2, h: 0.28, fontSize: 11, color: "C9D1C2" });
  slide.addText("A4.6 - Subassessoria de Orçamento", { x: 0.4, y: 6.95, w: 6, h: 0.3, fontSize: 9, color: "9BA89E" });
  slide.addText(new Date().toLocaleDateString("pt-BR"), { x: 7.6, y: 6.95, w: 2, h: 0.3, fontSize: 9, color: "9BA89E", align: "right" });
}

// ---- Construtores de dados para cada gráfico, a partir dos registros filtrados ----

export function dadosEvolucaoMensal(registros, anos) {
  const anosOrd = [...anos].sort((a, b) => a - b);
  const labels = MESES.slice(1);
  const series = anosOrd.map(ano => ({
    name: String(ano),
    labels,
    values: labels.map((_, i) => registros.filter(r => r.y === ano && r.m === i + 1).length),
  }));
  return { labels, series };
}

export function dadosPorFuncao(registros) {
  const ordem = ["S", "AS", "D", "AD", "C", "AE"];
  const labels = ordem.map(c => PAPEL_LABEL_CURTO[c]);
  const values = ordem.map(c => registros.filter(r => r.role === c).length);
  return { labels, values };
}

export function dadosPorEspectro(registros) {
  const ordem = ["E", "D", "C"];
  const labels = ordem.map(c => ESP_LABEL[c]);
  const values = ordem.map(c => registros.filter(r => r.esp === c).length);
  return { labels, values, cores: [COR.esq, COR.dir, COR.cen] };
}

export function dadosTopGabinetes(registros, n = 10) {
  const cont = {};
  for (const r of registros) {
    const chave = r.n || "—";
    cont[chave] = (cont[chave] || 0) + 1;
  }
  const ord = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, n);
  return { labels: ord.map(x => x[0]), values: ord.map(x => x[1]) };
}

export function dadosTopPartidos(registros, n = 10) {
  const cont = {};
  for (const r of registros) {
    if (!r.p) continue;
    cont[r.p] = (cont[r.p] || 0) + 1;
  }
  const ord = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, n);
  return { labels: ord.map(x => x[0]), values: ord.map(x => x[1]) };
}

// ---- Adiciona cada tipo de gráfico NATIVO a um slide ----

function addBarClustered(pptx, slide, { labels, series }, opts = {}) {
  const data = series.map((s, i) => ({ name: s.name, labels: s.labels, values: s.values }));
  slide.addChart(pptx.ChartType.bar, data, {
    x: opts.x ?? 0.5, y: opts.y ?? 1.2, w: opts.w ?? 9, h: opts.h ?? 5.2,
    barDir: "col", barGrouping: "clustered",
    chartColors: COR.anos,
    showLegend: series.length > 1, legendPos: "b",
    showValue: true, dataLabelFontSize: 9, dataLabelColor: "1C2620",
    catAxisLabelColor: "6B7568", valAxisLabelColor: "6B7568",
    catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
    showTitle: false,
  });
}

function addBarSingle(pptx, slide, { labels, values }, opts = {}) {
  const data = [{ name: opts.serieNome || "Contatos", labels, values }];
  slide.addChart(pptx.ChartType.bar, data, {
    x: opts.x ?? 0.5, y: opts.y ?? 1.2, w: opts.w ?? 9, h: opts.h ?? 5.2,
    barDir: opts.horizontal ? "bar" : "col",
    chartColors: opts.cores || [COR.brand],
    chartColorsOpacity: 100,
    showLegend: false,
    showValue: true, dataLabelFontSize: 10, dataLabelColor: "1C2620",
    dataLabelPosition: opts.horizontal ? "outEnd" : "outEnd",
    catAxisLabelColor: "6B7568", valAxisLabelColor: "6B7568",
    catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
    showTitle: false,
  });
}

// ---- Exportação do PAINEL inteiro ----

export async function exportarPainelPptx({ registros, anos, mes, papel, resumo }) {
  const pptxgen = await getPptx();
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 10, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "A4.6 - Subassessoria de Orçamento";
  pptx.title = "Métricas de Gestão";

  const sub = subtituloFiltros({ anos, mes, papel });

  // Slide 1 — capa com resumo
  const capa = pptx.addSlide();
  capa.background = { color: "16211B" };
  capa.addText("MÉTRICAS DE GESTÃO", { x: 0.5, y: 2.1, w: 9, h: 0.8, fontSize: 40, bold: true, color: "FFFFFF", align: "center", fontFace: "Georgia" });
  capa.addText("A4.6 - Subassessoria de Orçamento", { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 18, color: "67B588", align: "center" });
  capa.addText(sub, { x: 0.5, y: 3.7, w: 9, h: 0.4, fontSize: 12, color: "C9D1C2", align: "center" });

  const cards = [
    ["Total geral", resumo.totalGeral],
    ["Total no período", resumo.totalPeriodo],
    ["Contatos no mês atual", resumo.totalMes],
  ];
  let cx = 1.2;
  for (const [label, val] of cards) {
    capa.addShape(pptx.ShapeType.roundRect, { x: cx, y: 4.5, w: 2.4, h: 1.4, fill: { color: "1E2A23" }, line: { color: "3B7C53", width: 1 }, rectRadius: 0.1 });
    capa.addText(String(val), { x: cx, y: 4.7, w: 2.4, h: 0.7, fontSize: 30, bold: true, color: "FFFFFF", align: "center", fontFace: "Georgia" });
    capa.addText(label, { x: cx, y: 5.4, w: 2.4, h: 0.4, fontSize: 11, color: "9BA89E", align: "center" });
    cx += 2.6;
  }

  // Slide 2 — Evolução mensal (série por ano)
  const s2 = pptx.addSlide();
  aplicarBase(s2, pptx, "Evolução mensal", sub);
  addBarClustered(pptx, s2, dadosEvolucaoMensal(registros, anos));

  // Slide 3 — Por função + Por espectro (somados)
  const s3 = pptx.addSlide();
  aplicarBase(s3, pptx, "Por função e por espectro", sub);
  addBarSingle(pptx, s3, dadosPorFuncao(registros), { x: 0.4, y: 1.2, w: 4.6, h: 5.0, horizontal: true, serieNome: "Contatos" });
  const esp = dadosPorEspectro(registros);
  addBarSingle(pptx, s3, esp, { x: 5.2, y: 1.2, w: 4.4, h: 5.0, cores: esp.cores, serieNome: "Contatos" });

  // Slide 4 — Top 10 gabinetes/contatos (somado)
  const s4 = pptx.addSlide();
  aplicarBase(s4, pptx, "10 mais visitados/contatados", sub);
  addBarSingle(pptx, s4, dadosTopGabinetes(registros), { x: 0.5, y: 1.2, w: 9, h: 5.2, horizontal: true, serieNome: "Contatos" });

  // Slide 5 — Top 10 partidos (somado)
  const s5 = pptx.addSlide();
  aplicarBase(s5, pptx, "10 partidos mais visitados/contatados", sub);
  addBarSingle(pptx, s5, dadosTopPartidos(registros), { x: 0.5, y: 1.2, w: 9, h: 5.2, horizontal: true, serieNome: "Contatos" });

  await pptx.writeFile({ fileName: `Metricas_Gestao_A4-6_${rotuloAnos(anos)}.pptx` });
}

// ---- Exportação de UM gráfico individual em PPTX (nativo) ----

export async function exportarGraficoPptx({ tipo, titulo, dados, anos, mes, papel }) {
  const pptxgen = await getPptx();
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 10, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "A4.6 - Subassessoria de Orçamento";

  const sub = subtituloFiltros({ anos, mes, papel });
  const slide = pptx.addSlide();
  aplicarBase(slide, pptx, titulo, sub);

  if (tipo === "evolucao") {
    addBarClustered(pptx, slide, dados);
  } else if (tipo === "espectro") {
    addBarSingle(pptx, slide, dados, { cores: dados.cores, serieNome: "Contatos" });
  } else if (tipo === "funcao") {
    addBarSingle(pptx, slide, dados, { horizontal: true, serieNome: "Contatos" });
  } else {
    // top gabinetes / top partidos
    addBarSingle(pptx, slide, dados, { horizontal: true, serieNome: "Contatos" });
  }

  const nome = titulo.replace(/[^\w]+/g, "_");
  await pptx.writeFile({ fileName: `${nome}_A4-6.pptx` });
}

// ---- Exportação de UM gráfico como PNG (captura do elemento renderizado) ----

export async function exportarGraficoPng(elemento, nomeArquivo) {
  if (!elemento) return;
  const toPng = await getToPng();
  const dataUrl = await toPng(elemento, {
    backgroundColor: "#0f1713",
    pixelRatio: 2,
    filter: (node) => !(node.classList && node.classList.contains("no-export")),
  });
  const link = document.createElement("a");
  link.download = `${nomeArquivo}.png`;
  link.href = dataUrl;
  link.click();
}
