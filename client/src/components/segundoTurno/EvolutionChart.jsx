import React, { useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { LineChart as IconeGrafico } from 'lucide-react';
import { fmtDec, fmtHora, fmtPct, isNum } from './utils';

const LINHAS = [
  { key: 'oficial', nome: 'Apurado (TSE)', cor: '#e2e8f0', largura: 2, tracejado: undefined },
  { key: 'm1', nome: 'Métrica 1', cor: '#fbbf24', largura: 2, tracejado: '5 4' },
  { key: 'm2', nome: 'Métrica 2', cor: '#34d399', largura: 3, tracejado: undefined },
];

function DicaGrafico({ active, payload, eixo }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-slate-950/95 ring-1 ring-white/15 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200 tabular-nums">
        {eixo === 'hora' ? `${fmtHora(p.t)} · ${fmtDec(p.pct)}% apurado` : `${fmtDec(p.pct)}% apurado · ${fmtHora(p.t, false)}`}
      </p>
      {LINHAS.map((l) => (
        <p key={l.key} className="mt-0.5 flex items-center justify-between gap-4 tabular-nums">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-0.5 w-3 rounded" style={{ background: l.cor }} />
            {l.nome}
          </span>
          <span className="font-bold text-white">{fmtPct(p[l.key])}</span>
        </p>
      ))}
    </div>
  );
}

// Evolução do % do candidato 0 (oficial, M1, M2) com referência em 50%.
export default function EvolutionChart({ serie, candidato, titulo, seletor = null, altura = 260 }) {
  const [eixo, setEixo] = useState('hora');
  const dados = useMemo(() => (Array.isArray(serie) ? serie : [])
    .filter((p) => Array.isArray(p) && isNum(p[0]))
    .map((p) => ({ t: p[0], pct: p[1], oficial: p[2], m1: p[3], m2: p[4] })), [serie]);

  const dominio = useMemo(() => {
    const vals = [50];
    dados.forEach((d) => [d.oficial, d.m1, d.m2].forEach((v) => isNum(v) && vals.push(v)));
    const min = Math.max(0, Math.floor(Math.min(...vals) - 1.5));
    const max = Math.min(100, Math.ceil(Math.max(...vals) + 1.5));
    return [min, max];
  }, [dados]);

  const nome = candidato?.nome || 'candidato';

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
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${eixo === k ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {dados.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-10 text-center" style={{ minHeight: altura - 40 }}>
          <IconeGrafico className="w-7 h-7 text-slate-600" />
          <p className="max-w-xs text-sm text-slate-400">O gráfico começa a ser desenhado quando a apuração começar.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 -ml-2" style={{ height: altura }}>
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
                <Tooltip content={<DicaGrafico eixo={eixo} />} cursor={{ stroke: 'rgba(148,163,184,0.35)' }} />
                {LINHAS.map((l) => (
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
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
            {LINHAS.map((l) => (
              <span key={l.key} className="inline-flex items-center gap-1.5">
                <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" stroke={l.cor} strokeWidth={l.largura} strokeDasharray={l.tracejado} /></svg>
                {l.nome}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" stroke="#f8fafc" strokeOpacity="0.6" strokeDasharray="2 3" /></svg>
              50%
            </span>
          </div>
        </>
      )}
    </section>
  );
}
