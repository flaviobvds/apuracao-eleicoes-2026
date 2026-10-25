import React from 'react';
import Modal from './Modal';

function Secao({ titulo, cor = 'text-indigo-300', children }) {
  return (
    <section className="space-y-2.5">
      <h3 className={`text-sm font-black uppercase tracking-wider ${cor}`}>{titulo}</h3>
      <div className="space-y-2.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function Formula({ children }) {
  return (
    <div className="rounded-xl bg-slate-900 ring-1 ring-white/10 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-slate-100 overflow-x-auto">
      {children}
    </div>
  );
}

function Lista({ itens }) {
  return (
    <ul className="space-y-2">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MetodologiaModal({ aberto, onFechar }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Como calculamos" subtitulo="As duas métricas de projeção do 2º turno" lado="direita">
      <div className="space-y-7 pb-6">
        <Secao titulo="Unidade de cálculo" cor="text-slate-200">
          <p>
            Tudo é calculado em <strong className="text-white">6.292 pares município × zona eleitoral</strong> (cada
            zona dentro de cada município, incluindo o exterior) e depois somado para cada UF e para o Brasil.
          </p>
          <p>
            Para governador, usamos os <strong className="text-white">513 pares</strong> dos 6 estados com 2º turno
            (AC, AM, DF, ES, RN e TO).
          </p>
        </Secao>

        <Secao titulo="Votos que ainda faltam em cada par" cor="text-slate-200">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Comum às duas métricas</p>
          <Formula>
            votos que faltam =<br />
            &nbsp;&nbsp;eleitores das seções ainda não apuradas no par<br />
            &nbsp;&nbsp;× votos válidos por eleitor no par (1º turno)<br />
            &nbsp;&nbsp;× fator de comparecimento
          </Formula>
          <p>
            O <strong className="text-white">fator de comparecimento</strong> compara, nos pares já apurados da UF, os
            votos válidos reais do 2º turno com o que o 1º turno previa (antes da apuração ele vale 1).
          </p>
        </Secao>

        <Secao titulo="Métrica 1 — Proporção do 1º turno" cor="text-sky-300">
          <p>
            Para cada par calculamos a proporção entre os dois finalistas no 1º turno, ignorando os demais candidatos:
          </p>
          <Formula>p = votos de A ÷ (votos de A + votos de B)</Formula>
          <Lista
            itens={[
              'Votos já apurados no 2º turno entram como reais; os votos que faltam em cada par são divididos pela proporção p daquele par.',
              <>
                <strong className="text-white">Projeção pré-apuração (fixa):</strong> antes de qualquer voto apurado,
                supõe que todos os votos válidos de cada par no 1º turno se dividem no 2º turno na proporção p. Esse
                número não muda durante a apuração.
              </>,
              <>
                <strong className="text-white">Limitação:</strong> não usa nenhuma informação sobre como os eleitores dos
                demais candidatos estão votando no 2º turno.
              </>,
            ]}
          />
        </Secao>

        <Secao titulo="Métrica 2 — Projeção em tempo real" cor="text-emerald-300">
          <Lista
            itens={[
              'A cada atualização (a cada 20 a 60 s), lemos no TSE o resultado parcial dos pares município × zona que avançaram desde a leitura anterior (até 3.000 por vez, começando pelos lidos há mais tempo).',
              <>
                Nos pares que já têm seções apuradas, medimos o <strong className="text-white">swing</strong>: quanto a
                proporção real do 2º turno se afastou da proporção p do 1º turno (em escala logística, ponderado pelos
                votos). O swing é calculado por UF; enquanto uma UF tem poucos votos apurados, ele é puxado para o swing
                nacional.
              </>,
              'Para os votos que faltam em cada par, usamos uma mistura:',
            ]}
          />
          <Formula>
            proporção dos votos que faltam =<br />
            &nbsp;&nbsp;w × (resultado já apurado no par)<br />
            &nbsp;&nbsp;+ (1 − w) × (p do 1º turno corrigida pelo swing da UF)<br />
            <span className="text-slate-400">onde w = % do eleitorado do par já apurado</span>
          </Formula>
          <Lista
            itens={[
              'Pares sem nenhuma seção apurada usam só a proporção do 1º turno corrigida pelo swing.',
              'Para governador, o swing é calculado só dentro do próprio estado.',
            ]}
          />
        </Secao>

        <Secao titulo="Leitura" cor="text-amber-300">
          <p>
            No início da apuração as duas métricas ficam próximas; a Métrica 2 incorpora o comportamento real dos
            eleitores no 2º turno e tende a ser mais precisa. Quando a apuração chega a 100%, as duas coincidem com o
            resultado oficial.
          </p>
        </Secao>

        <p className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 text-xs text-slate-400">
          Fonte: API pública de divulgação de resultados do TSE (resultados.tse.jus.br). Projeções são estimativas
          estatísticas, não resultados oficiais.
        </p>
      </div>
    </Modal>
  );
}
