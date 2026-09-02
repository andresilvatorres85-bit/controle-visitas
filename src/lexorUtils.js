import { ACOES_LEXOR, UO_LEXOR } from "./data/lexor.js";

// Reproduz a lógica da mala direta do Word no layout do relatório oficial do
// Lexor: cada campo vem da planilha SIOPLEx (dados da proposta) ou da aba
// Ações (tabela de apoio, consultada pelo código da ação).

// ---------------------------------------------------------------------------
// Cabeçalho do relatório. Trocar a cada exercício.
// ---------------------------------------------------------------------------
export const CABECALHO = {
  orgao: "Congresso Nacional",
  comissao: "Comissão Mista de Planos, Orçamentos Públicos e Fiscalização",
  sistema: "Lexor - Sistemas de Leis Orçamentárias",
  projeto: "PLN 24/2026 - Projeto de Lei Orçamentária Anual para 2027",
  titulo: "Relatório de espelho de Emendas",
  aviso: "Este espelho de emenda estará disponível no Sistema Lexor, para importação, conforme cronograma do PLOA 2027",
};

// Cancelamento compensatório padrão — igual em todos os espelhos, exceto o
// valor, que acompanha a soma dos acréscimos (GND 3 + GND 4).
export const CANCELAMENTO_PADRAO = {
  sequencial: "000003565",
  fonte: "1000",
  gnd: "9",
  gndNome: "Reserva de Contingência",
  modalidade: "99",
  modalidadeNome: "A Definir",
  id: "0",
  rp: "2",
};

// Descrições da classificação orçamentária. Editar aqui se a SOF alterar.
export const ESFERAS = {
  10: "Orçamento Fiscal",
  20: "Orçamento da Seguridade Social",
  30: "Orçamento de Investimento",
};

export const FUNCOES = { "05": "Defesa Nacional" };

export const SUBFUNCOES = {
  122: "Administração Geral",
  153: "Defesa Terrestre",
  301: "Atenção Básica",
  363: "Ensino Profissional",
  364: "Ensino Superior",
  368: "Educação Básica",
  572: "Desenvolvimento Tecnológico e Engenharia",
};

export const PROGRAMAS = {
  "0032": "Programa de Gestão e Manutenção do Poder Executivo",
  6112: "Defesa Nacional",
};

export const GND_NOMES = { 3: "Outras Despesas Correntes", 4: "Investimentos" };

const CNPJ_COMANDO = "Beneficiário para lançamento no SIOP - CNPJ: 00.394.452/0001-03 - Comando do Exército";

// ---------------------------------------------------------------------------

export function moeda(v) {
  return (v || 0).toLocaleString("pt-BR");
}

export function valorTotal(p) {
  return (p.gnd3 || 0) + (p.gnd4 || 0);
}

// O exercício vem dos 4 primeiros dígitos do Nr Proposta (ex.: 20270032 -> 2027)
export function exercicioDe(p) {
  const s = String(p.nr || "");
  const ano = Number(s.slice(0, 4));
  return ano >= 2020 && ano <= 2099 ? ano : null;
}

export function nomeUO(codigo) {
  return UO_LEXOR[codigo] || "";
}

// Junta código e descrição no formato "0032 - Programa de Gestão…"
function comDescricao(codigo, tabela) {
  if (!codigo) return "";
  const desc = tabela[codigo];
  return desc ? `${codigo} - ${desc}` : String(codigo);
}

// Ementa: mesma frase montada pelo modelo do Word, campo a campo.
export function montarEmenta({ tipo, uf, descricaoAcao, beneficiario, cidade, uoCod, uoNome, objeto }) {
  return [
    "Exército Brasileiro",
    tipo || "Emenda",
    uf || "—",
    `${descricaoAcao || "—"} na (o) ${beneficiario || "—"}, no município de ${cidade || "—"}`
    + ` - Unidade Orçamentária: ${uoCod || "—"} - ${uoNome || "—"} - ${uf || "—"}.`
    + ` ${objeto || ""}`,
  ].join(" – ").trim();
}

// Reúne tudo que o espelho precisa imprimir.
export function montarEspelho(p, exercicioForcado) {
  const acao = ACOES_LEXOR[p.acao] || null;
  const uoCod = p.uo || acao?.uoCod || "";
  const uoNome = nomeUO(uoCod) || acao?.uoNome || "";
  const exercicio = exercicioForcado || exercicioDe(p) || "";

  const linhas = [];
  if (p.gnd3) linhas.push({ gnd: "3", gndNome: GND_NOMES[3], valor: p.gnd3 });
  if (p.gnd4) linhas.push({ gnd: "4", gndNome: GND_NOMES[4], valor: p.gnd4 });
  const total = valorTotal(p);

  // Funcional programática no formato do Lexor: 05.301.0032.2E74.
  const funcional = [p.funcao, p.subfuncao, p.programa, p.acao]
    .filter(Boolean).join(".") + (p.acao ? "." : "");

  const justificativa = [
    CNPJ_COMANDO,
    `Organização Militar Beneficiária: ${p.beneficiario || "—"}`,
    p.justificativa || "",
  ].filter(Boolean).join("\n");

  return {
    exercicio,
    ementa: montarEmenta({
      tipo: p.tipo,
      uf: p.uf,
      descricaoAcao: acao?.descricao,
      beneficiario: p.beneficiario,
      cidade: p.cidade,
      uoCod,
      uoNome,
      objeto: p.objeto,
    }),
    sequencial: acao?.seq || "",
    esfera: comDescricao(p.esfera, ESFERAS),
    orgao: `${acao?.orgaoCod || "52000"} - ${acao?.orgaoNome || "Ministério da Defesa"}`,
    unidade: uoCod ? `${uoCod} - ${uoNome}` : "",
    funcional,
    funcao: comDescricao(p.funcao, FUNCOES),
    subfuncao: comDescricao(p.subfuncao, SUBFUNCOES),
    programa: comDescricao(p.programa, PROGRAMAS),
    acaoTexto: p.acao ? `${p.acao} - ${acao?.descricao || ""}`.replace(/ - $/, "") : "",
    // o subtítulo só é atribuído pela SOF depois; a tabela Ações traz "XXXX"
    subtitulo: acao?.subtitulo || p.subtitulo || "XXXX",
    descricaoSubtitulo: p.objeto || "",
    produto: acao?.produto && acao.produto !== "-"
      ? `${acao.produto} (${acao.unidade || "unidade"})` : "",
    meta: String(acao?.meta || "1"),
    linhas,
    total,
    rp: p.rp || "6",
    cancelamento: { ...CANCELAMENTO_PADRAO, valor: total },
    justificativa,
    autor: [p.parlamentar, p.partido ? `(${p.partido})` : ""].filter(Boolean).join(" "),
    temAcao: !!acao,
  };
}

// Lista o que impede a emenda de ser exportada ao LEXOR, para sinalizar na tela.
export function pendencias(p) {
  const lista = [];
  if (!p.acao) lista.push("sem código de ação");
  else if (!ACOES_LEXOR[p.acao]) lista.push(`ação ${p.acao} não cadastrada na aba Ações`);
  else if (!ACOES_LEXOR[p.acao].seq) lista.push("ação sem Sequencial SOF");
  if (!p.parlamentar) lista.push("sem parlamentar autor");
  if (!valorTotal(p)) lista.push("sem valor em GND 3 e GND 4");
  if (!p.objeto) lista.push("sem objeto");
  if (!p.beneficiario) lista.push("sem beneficiário");
  if (p.rep) lista.push("marcada como repetida na planilha");
  return lista;
}
