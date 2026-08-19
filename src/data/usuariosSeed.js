// Semente inicial de usuários (os nomes que já existiam no "Registrado por").
// O app insere estes nomes na tabela do Supabase no primeiro acesso, caso a
// tabela esteja vazia. O e-mail de cada um começa vazio — você associa depois
// na aba Configurações > Usuários.
export const USUARIOS_SEED = [
  { nome: "Maj Tiago Felix", email: null },
  { nome: "Maj Torres", email: null },
  { nome: "ST Bacchiega", email: null },
];
