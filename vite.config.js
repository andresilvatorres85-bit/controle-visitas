import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' faz os arquivos gerados usarem caminhos relativos, o que funciona
// tanto em https://usuario.github.io/nome-do-repo/ quanto em domínio próprio,
// sem precisar editar nada aqui depois de criar o repositório.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
