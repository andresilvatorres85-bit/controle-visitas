// Exporta os espelhos exibidos na tela para um arquivo que o Word abre com o
// layout preservado (HTML empacotado como documento do Word). É o caminho que
// mantém a formatação da folha e deixa todo o texto selecionável e editável.

// Só as regras do espelho entram no arquivo; o tema escuro do aplicativo fica
// de fora para o documento nascer com fundo branco.
function cssDoEspelho() {
  const regras = [];
  for (const folha of document.styleSheets) {
    let lista;
    try {
      lista = folha.cssRules;
    } catch {
      continue; // folha de outro domínio (fontes externas)
    }
    for (const regra of lista) {
      const sel = regra.selectorText || "";
      if (/\.lx|\.espelho-folha|\.esp-pendencias/.test(sel)) regras.push(regra.cssText);
    }
  }
  return regras.join("\n");
}

export function exportarWord(nomeArquivo) {
  const area = document.querySelector(".espelho-area");
  if (!area) return;

  const copia = area.cloneNode(true);
  // remove botões de cópia e avisos que só fazem sentido na tela
  copia.querySelectorAll(".no-print").forEach(el => el.remove());
  copia.querySelectorAll(".espelho-folha").forEach((folha, i, todas) => {
    folha.style.boxShadow = "none";
    folha.style.width = "100%";
    folha.style.padding = "0";
    if (i < todas.length - 1) folha.style.pageBreakAfter = "always";
  });

  const html = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<title>Espelhos de emenda</title>
<style>
@page { size: 21cm 29.7cm; margin: 1.2cm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11px; color: #000; }
${cssDoEspelho()}
</style></head>
<body>${copia.innerHTML}</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeArquivo}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
