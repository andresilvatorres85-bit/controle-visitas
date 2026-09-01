import { ACOES_LEXOR, UO_LEXOR } from "./data/lexor.js";

// Reproduz a lógica da mala direta do Word: cada campo do espelho vem da
// planilha SIOPLEx (dados da proposta) ou da aba Ações (tabela de apoio,
// consultada pelo código da ação).

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

// Ementa: mesma frase montada pelo modelo do Word, campo a campo.
export function montarEmenta({ tipo, uf, descricaoAcao, beneficiario, cidade, uoCod, uoNome, objeto }) {
  const partes = [
    "Exército Brasileiro",
    tipo || "Emenda",
    uf || "—",
    `${descricaoAcao || "—"} na (o) ${beneficiario || "—"}, no município de ${cidade || "—"}`
    + ` - Unidade Orçamentária: ${uoCod || "—"} - ${uoNome || "—"} - ${uf || "—"}.`
    + ` ${objeto || ""}`,
  ];
  return partes.join(" – ").trim();
}

// Reúne tudo que o espelho precisa imprimir.
export function montarEspelho(p, exercicioForcado) {
  const acao = ACOES_LEXOR[p.acao] || null;
  const uoCod = p.uo || acao?.uoCod || "";
  const uoNome = nomeUO(uoCod) || acao?.uoNome || "";
  const exercicio = exercicioForcado || exercicioDe(p) || "";

  const linhas = [];
  if (p.gnd3) linhas.push({ gnd: "3", gndNome: "Custeio", valor: p.gnd3 });
  if (p.gnd4) linhas.push({ gnd: "4", gndNome: "Investimento", valor: p.gnd4 });

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
    orgaoCod: acao?.orgaoCod || "52000",
    orgaoNome: acao?.orgaoNome || "Ministério da Defesa",
    uoCod,
    uoNome,
    funcao: p.funcao || "",
    subfuncao: p.subfuncao || "",
    programa: p.programa || "",
    acaoCod: p.acao || "",
    // o subtítulo só é atribuído pela SOF depois; a tabela Ações traz o
    // marcador "XXXX", que é o que o modelo do Word imprime
    subtitulo: acao?.subtitulo || p.subtitulo || "XXXX",
    descricaoAcao: acao?.descricao || "",
    descricaoSubtitulo: p.objeto || "",
    produto: acao?.produto || "",
    unidade: acao?.unidade || "unidade",
    meta: String(acao?.meta || "1").padStart(2, "0"),
    linhas,
    total: valorTotal(p),
    rp: p.rp || "6",
    cnpj: acao?.cnpj || "",
    justificativa: p.justificativa || "",
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
