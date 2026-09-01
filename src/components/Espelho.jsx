import { montarEspelho, moeda, pendencias } from "../lexorUtils.js";

// Desenha uma folha de espelho de emenda no mesmo formato do documento
// produzido pela mala direta do Word. Fundo branco e tipografia própria,
// independentes do tema escuro do restante do aplicativo.

function Caixa({ children, largura, className = "" }) {
  return (
    <div className={`esp-box ${className}`} style={largura ? { width: largura } : undefined}>
      {children || "\u00A0"}
    </div>
  );
}

export default function Espelho({ proposta, exercicio }) {
  const e = montarEspelho(proposta, exercicio);
  const problemas = pendencias(proposta);

  return (
    <div className="espelho-folha">
      <h1 className="esp-titulo">EXÉRCITO BRASILEIRO</h1>
      <h2 className="esp-subtitulo">PROPOSTA DE EMENDA À DESPESA</h2>
      <div className="esp-exercicio">
        <span>( Projeto de Lei Orçamentária da União para o exercício de</span>
        <Caixa largura={64} className="esp-center">{e.exercicio}</Caixa>
        <span>)</span>
      </div>

      <div className="esp-ementa-row">
        <div className="esp-ementa-rot">Ementa:</div>
        <div className="esp-ementa-txt">{e.ementa}</div>
      </div>

      <div className="esp-esfera-row">
        <div className="esp-seq">
          <div className="esp-rot-forte">Sequencial SOF</div>
          <Caixa largura={150} className="esp-center">{e.sequencial}</Caixa>
        </div>
        <div className="esp-rot-forte esp-esfera-rot">Esfera Orçamentária</div>
        <div className="esp-esfera-lista">
          <div className="esp-esfera-item"><Caixa largura={20} className="esp-center">X</Caixa><span>Fiscal</span></div>
          <div className="esp-esfera-item"><Caixa largura={20} /><span>Seguridade Social</span></div>
          <div className="esp-esfera-item"><Caixa largura={20} /><span>Investimento das Estatais</span></div>
        </div>
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Órgão</div>
        <div className="esp-mini-rots"><span style={{ width: 76 }}>Código</span><span>Descrição</span></div>
        <div className="esp-linha">
          <Caixa largura={76} className="esp-center">{e.orgaoCod}</Caixa>
          <Caixa className="esp-flex">{e.orgaoNome}</Caixa>
        </div>
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Unidade Orçamentária</div>
        <div className="esp-mini-rots"><span style={{ width: 76 }}>Código</span><span>Descrição</span></div>
        <div className="esp-linha">
          <Caixa largura={76} className="esp-center">{e.uoCod}</Caixa>
          <Caixa className="esp-flex">{e.uoNome}</Caixa>
        </div>
      </div>

      <div className="esp-func-row">
        <div>
          <div className="esp-rot-forte">Funcional / Programática</div>
          <div className="esp-mini-rots esp-func-rots">
            <span>Função</span><span>Subfunção</span><span>Programa</span><span>Ação</span><span>Subtítulo</span>
          </div>
          <div className="esp-linha">
            <Caixa largura={54} className="esp-center">{e.funcao}</Caixa>
            <Caixa largura={62} className="esp-center">{e.subfuncao}</Caixa>
            <Caixa largura={62} className="esp-center">{e.programa}</Caixa>
            <Caixa largura={58} className="esp-center">{e.acaoCod}</Caixa>
            <Caixa largura={62} className="esp-center">{e.subtitulo}</Caixa>
          </div>
        </div>
        <div className="esp-aviso">
          Este espelho de emenda estará disponível no Sistema Lexor, para importação,
          conforme cronograma do PLOA {e.exercicio}
        </div>
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Descrição da Ação</div>
        <Caixa className="esp-full">{e.descricaoAcao}</Caixa>
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Descrição do Subtítulo</div>
        <Caixa className="esp-full">{e.descricaoSubtitulo}</Caixa>
      </div>

      <div className="esp-produto-row">
        <div className="esp-produto-col esp-flex">
          <div className="esp-rot-forte">Produto</div>
          <Caixa className="esp-full">{e.produto}</Caixa>
        </div>
        <div className="esp-produto-col" style={{ width: 210 }}>
          <div className="esp-rot-forte">Unidade de Medida</div>
          <Caixa className="esp-full">{e.unidade}</Caixa>
        </div>
        <div className="esp-produto-col" style={{ width: 92 }}>
          <div className="esp-rot-forte">Meta</div>
          <Caixa className="esp-full esp-right">{e.meta}</Caixa>
        </div>
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Acréscimos à Programação (R$ 1,00)</div>
        <div className="esp-mini-rots esp-acr-rots">
          <span className="esp-acr-gnd">Grupo de Natureza de Despesa – GND</span>
          <span className="esp-acr-mod">Modalidade de Aplicação</span>
          <span className="esp-acr-rp">RP</span>
          <span className="esp-acr-val">Acréscimo</span>
        </div>
        {e.linhas.map(l => (
          <div className="esp-linha" key={l.gnd}>
            <Caixa largura={36} className="esp-center">{l.gnd}</Caixa>
            <Caixa largura={244}>{l.gndNome}</Caixa>
            <Caixa largura={42} className="esp-center">90</Caixa>
            <Caixa largura={180}>Aplicação direta</Caixa>
            <Caixa largura={32} className="esp-center">{e.rp}</Caixa>
            <Caixa largura={92} className="esp-right">{moeda(l.valor)}</Caixa>
          </div>
        ))}
        {e.linhas.length === 0 && (
          <div className="esp-linha"><Caixa className="esp-full esp-vazio">sem valores lançados na planilha</Caixa></div>
        )}
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Cancelamentos Compensatórios (R$ 1,00)</div>
        <div className="esp-mini-rots esp-canc-rots">
          <span style={{ width: 66 }}>Sequencial</span>
          <span style={{ width: 50 }}>Fonte</span>
          <span style={{ width: 190 }}>Grupo Nat. Despesa - GND</span>
          <span style={{ width: 180 }}>Modalidade de Aplicação</span>
          <span style={{ width: 32 }}>IU</span>
          <span style={{ width: 32 }}>RP</span>
          <span style={{ width: 92 }}>Cancelamento</span>
        </div>
        {[0, 1, 2].map(i => (
          <div className="esp-linha" key={i}>
            <Caixa largura={66} /><Caixa largura={50} /><Caixa largura={190} />
            <Caixa largura={180} /><Caixa largura={32} /><Caixa largura={32} /><Caixa largura={92} />
          </div>
        ))}
      </div>

      <div className="esp-bloco">
        <div className="esp-rot-forte">Justificativa</div>
        <div className="esp-just">
          <p>{e.cnpj}</p>
          <p className="esp-just-txt">{e.justificativa}</p>
        </div>
      </div>

      <div className="esp-autor">
        <span className="esp-autor-rot">Autor:</span>
        {e.autor
          ? <Caixa>{e.autor}</Caixa>
          : <Caixa largura={230} className="esp-vazio">a definir</Caixa>}
      </div>

      {problemas.length > 0 && (
        <div className="esp-pendencias no-print">
          <strong>Pendências para exportação:</strong> {problemas.join(" · ")}
        </div>
      )}
    </div>
  );
}
