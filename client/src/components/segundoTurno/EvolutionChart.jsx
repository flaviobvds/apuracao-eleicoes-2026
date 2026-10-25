import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { LineChart as IconeGrafico } from 'lucide-react';
import { useHistoricoServidor } from './useHistoricoServidor';
import { candidatosDe, clarear, coresCorrida, fmtDec, fmtHora, fmtPct, isNum } from './utils';

const LINHAS = [
  { key: 'oficial', nome: 'Apurado (TSE)', cor: '#e2e8f0', largura: 2, tracejado: undefined },
  { key: 'm1', nome: 'Métrica 1', cor: '#fbbf24', largura: 2, tracejado: '5 4' },
  { key: 'm2', nome: 'Métrica 2', cor: '#34d399', largura: 3, tracejado: undefined },
];

const CHAVE_LINHAS = 'segundoTurno2026:linhasGrafico:v1';
const TODAS = { oficial: true, m1: true, m2: true };

function lerLinhas() {
  try {
    const obj = JSON.parse(window.localStorage.getItem(CHAVE_LINHAS) || 'null');
    if (!obj || typeof obj !== 'object') return TODAS;
    const v = { oficial: obj.oficial !== false, m1: obj.m1 !== false, m2: obj.m2 !== false };
    return v.oficial || v.m1 || v.m2 ? v : TODAS;
  } catch {
    return TODAS;
  }
}

function primeiroNome(c) {
  return (c?.nome || '').split(/\s+/)[0] || 'Candidato';
}

function Amostra({ linha }) {
  return (
    <svg width="18" height="6" aria-hidden="true" className="shrink-0">
      <line x1="0" y1="3" x2="18" y2="3" stroke={linha.cor} strokeWidth={linha.largura} strokeDasharray={linha.tracejado} />
    </svg>
  );
}

function DicaGrafico({ active, payload, linhas, candidatos, cores }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="min-w-[13rem] rounded-xl bg-slate-950/95 px-3 py-2 text-xs shadow-xl ring-1 ring-white/15">
      <p className="font-semibold text-slate-200 tabular-nums">
        {fmtHora(p.t, false)} · {fmtDec(p.pct)}% apurado
      </p>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1 tabular-nums">
        <span />
        <span className="text-right text-[10px] font-bold uppercase" style={{ color: clarear(cores[0], 0.3) }}>{primeiroNome(candidatos[0])}</span>
        <span className="text-right text-[10px] font-bold uppercase" style={{ color: clarear(cores[1], 0.3) }}>{primeiroNome(candidatos[1])}</span>
        {linhas.map((l) => (
          <React.Fragment key={l.key}>
            <span className="flex items-center gap-1.5 text-slate-400"><Amostra linha={l} />{l.nome}</span>
            <span className="text-right font-bold text-white">{fmtPct(p[l.key])}</span>
            <span className="text-right text-slate-300">{isNum(p[l.key]) ? fmtPct(100 - p[l.key]) : '—'}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Evolução do % do candidato 0 (oficial, M1, M2) com referência em 50% e filtro de linhas.
export default function EvolutionChart({
  race, historicoLocal, modo, ciclo, titulo, seletor = null, altura = 260,
}) {
  const [eixo, setEixo] = useState('hora');
  const [visiveis, setVisiveis] = useState(lerLinhas);
  const { serie, fonte } = useHistoricoServidor(race, { modo, ciclo, historicoLocal });
  const candidatos = candidatosDe(race);
  const cores = coresCorrida(race);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_LINHAS, JSON.stringify(visiveis));
    } catch {
      // sem localStorage: a escolha vale só nesta visita
    }
  }, [visiveis]);

  const linhasVisiveis = LINHAS.filter((l) => visiveis[l.key]);
  const qtdLigadas = linhasVisiveis.length;

  const alternar = (key) => {
    setVisiveis((v) => {
      const ligadas = Object.values(v).filter(Boolean).length;
      if (v[key] && ligadas <= 1) return v; // a última linha não desliga
      return { ...v, [key]: !v[key] };
    });
  };

  const dados = useMemo(() => serie
    .map((p) => ({ t: p[0], pct: p[1], oficial: p[2], m1: p[3], m2: p[4] })), [serie]);

  const dominio = useMemo(() => {
    const vals = [50];
    dados.forEach((d) => LINHAS.forEach((l) => visiveis[l.key] && isNum(d[l.key]) && vals.push(d[l.key])));
    const min = Math.max(0, Math.floor(Math.min(...vals) - 1));
    const max = Math.min(100, Math.ceil(Math.max(...vals) + 1));
    return [min, max];
  }, [dados, visiveis]);

  const nome = candidatos[0]?.nome || 'candidato';

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Evolução da apuração</p>
          <h3 className="truncate text-base sm:text-lg font-black text-white">{titulo || `% de ${nome}`}</h3>
          <p className="text-xs text-slate-400">% de {nome} entre os dois finalistas · acima de 50% = à frente</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seletor}
          <div className="inline-flex rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/10" role="group" aria-label="Eixo horizontal">
            {[['hora', 'Hora'], ['pct', '% apurado']].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setEixo(k)}
                aria-pressed={eixo === k}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition-colors ${eixo === k ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtro de linhas */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Linhas exibidas no gráfico">
        {LINHAS.map((l) => {
          const ligada = visiveis[l.key];
          const travada = ligada && qtdLigadas <= 1;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => alternar(l.key)}
              aria-pressed={ligada}
              aria-disabled={travada || undefined}
              title={travada ? 'Pelo menos uma linha precisa ficar visível' : ligada ? `Ocultar ${l.nome}` : `Mostrar ${l.nome}`}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs sm:text-sm font-semibold ring-1 transition-colors ${ligada ? 'bg-white/10 text-white' : 'bg-transparent text-slate-500 ring-white/10 hover:text-slate-300'} ${travada ? 'cursor-not-allowed' : ''}`}
              style={ligada ? { boxShadow: `inset 0 0 0 1.5px ${l.cor}99` } : undefined}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: ligada ? l.cor : 'transparent', border: `2px solid ${l.cor}` }}
                aria-hidden="true"
              />
              {l.nome}
            </button>
          );
        })}
      </div>

      {dados.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center" style={{ minHeight: altura - 40 }}>
          <IconeGrafico className="w-7 h-7 text-slate-600" />
          <p className="max-w-sm text-sm text-slate-400">
            O gráfico começa a ser desenhado quando a apuração começar, às 17h. A partir daí, a curva completa fica
            disponível para quem abrir a página, com um ponto por minuto.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 -ml-2" style={{ height: altura }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey={eixo === 'hora' ? 't' : 'pct'}
                  type="number"
                  domain={eixo === 'hora' ? ['dataMin', 'dataMax'] : [0, 100]}
                  tickFormatter={(v) => (eixo === 'hora' ? fmtHora(v, false) : `${Math.round(v)}%`)}
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={dominio}
                  tickFormatter={(v) => `${v}%`}
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                />
                <ReferenceLine y={50} stroke="#f8fafc" strokeOpacity={0.6} strokeDasharray="2 3" label={{ value: '50%', position: 'insideTopRight', fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip
                  content={<DicaGrafico linhas={linhasVisiveis} candidatos={candidatos} cores={cores} />}
                  cursor={{ stroke: 'rgba(148,163,184,0.35)' }}
                />
                {linhasVisiveis.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.nome}
                    stroke={l.cor}
                    strokeWidth={l.largura}
                    strokeDasharray={l.tracejado}
                    dot={dados.length < 3 ? { r: 3 } : false}
                    activeDot={{ r: 4 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" stroke="#f8fafc" strokeOpacity="0.6" strokeDasharray="2 3" /></svg>
              50% · linha tracejada branca
            </span>
            <span>
              Atualizado minuto a minuto
              {fonte === 'local' ? ' · histórico deste navegador' : fonte === 'mock' ? ' · histórico simulado (mock)' : ''}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
