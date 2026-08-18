export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// Estados por extenso, para a seleção do AsPar EB (Assessor Parlamentar do Exército)
export const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" }, { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" }, { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" }, { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" }, { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" }, { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

// Assuntos possíveis para contatos com Assessores Parlamentares do Exército
export const ASSUNTOS_ASPAR = ["Cartilha", "Dúvida", "Ajuste de emenda"];

// Nomes fixos de quem registra os contatos
export const REGISTRADORES = ["Maj Tiago Felix", "Maj Torres", "ST Bacchiega"];

export const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MESES_LONGO = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// role: S=Senador, AS=Asse.Sen, D=Deputado, AD=Asse.Dep, C=Consultor, AE=AsPar EB
export const PAPEL_LABEL = { S: "Senador", AS: "Assessor de Senador", D: "Deputado", AD: "Assessor de Deputado", C: "Consultor", AE: "AsPar EB" };
export const PAPEL_LABEL_CURTO = { S: "Senador", AS: "Asse. Sen.", D: "Deputado", AD: "Asse. Dep.", C: "Consultor", AE: "AsPar EB" };
export const ESP_LABEL = { E: "Esquerda", D: "Direita", C: "Centro" };
export const ESP_COR = { E: "var(--esq)", D: "var(--dir)", C: "var(--cen)" };
