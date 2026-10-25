import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowLeftRight, LineChart as IconeGrafico } from 'lucide-react';
import { useHistoricoServidor } from './useHistoricoServidor';
import { useI18n } from '../../i18n/useI18n';
import { candidatosDe, clarear, coresCorrida, fmtDec, fmtHora, fmtPct, isNum } from './utils';

// Fonte das duas linhas: índice no ponto compacto [t, pctSecoes, oficial, metrica1, metrica2]
const FONTES = [
  { valor: 'oficial', labelKey: 'evolutionChart.fonteOficial', idx: 2 },
  { valor: 'm1', labelKey: 'evolutionChart.fonteM1', idx: 3 },
  { valor: 'm2', labelKey: 'evolutionChart.fonteM2', idx: 4 },
];

const CHAVE_FONTE = 'segundoTurno2026:fonteGrafico:v1';

function lerFonte() {
  try {
    const v = window.localStorage.getItem(CHAVE_FONTE);
    return FONTES.some((f) => f.valor === v) ? v : 'oficial';
  } catch {
    return 'oficial';
  }
}

// Viradas: troca do sinal de (x - 50) entre pontos consecutivos, ignorando empate exato.
function detectarViradas(dados) {
  const viradas = [];
  let ant = null;
  dados.forEach((d) => {
    const s = Math.sign(d.c0 - 50);
    if (s === 0) return;
    if (ant && Math.sign(ant.c0 - 50) !== s) {
      const frac = (50 - ant.c0) / (d.c0 - ant.c0);
      viradas.push({
        t: ant.t + (d.t - ant.t) * frac,
        pct: isNum(ant.pct) && isNum(d.pct) ? ant.pct + (d.pct - ant.pct) * frac : d.pct,
        lider: s > 0 ? 0 : 1,
      });
    }
    ant = d;
  });
  return viradas;
}

function DicaGrafico({ active, payload, candidatos, cores, fonteLabel }) {
  const { t } = useI18n();
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const lider = p.c0 > p.c1 ? 0 : p.c1 > p.c0 ? 1 : null;
  return (
    <div className="min-w-[12.5rem] rounded-xl bg-slate-950/95 px-3 py-2 text-xs shadow-xl ring-1 ring-white/15">
      <p className="font-semibold text-slate-200 tabular-nums">
        {t('evolutionChart.dicaApurado', { hora: fmtHora(p.t, false), pct: fmtDec(p.pct) })}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{fonteLabel}</p>
      <div className="mt-1.5 space-y-1">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-3 rounded-md px-1.5 py-0.5 tabular-nums ${lider === i ? 'bg-white/10' : ''}`}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cores[i] }} />
              <span className={`truncate ${lider === i ? 'font-bold text-white' : 'text-slate-300'}`}>{candidatos[i]?.nome || t('evolutionChart.candidatoN', { n: i + 1 })}</span>
            </span>
            <span className={lider === i ? 'font-black' : 'font-semibold'} style={{ color: clarear(cores[i], 0.3) }}>
              {fmtPct(i === 0 ? p.c0 : p.c1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Evolução do % de cada finalista (entre os dois) com detecção de virada.
export default function EvolutionChart({
  race, historicoLocal, modo, ciclo, titulo, seletor = null, altura = 260,
}) {
  const { t } = useI18n();
  const [eixo, setEixo] = useState('hora');
  const [fonte, setFonte] = useState(lerFonte);
  const { serie, fonte: origem } = useHistoricoServidor(race, { modo, ciclo, historicoLocal });
  const candidatos = candidatosDe(race);
  const cores = coresCorrida(race);
  const fonteAtual = FONTES.find((f) => f.valor === fonte) || FONTES[0];

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_FONTE, fonte);
    } catch {
      // sem localStorage: a escolha vale só nesta visita
    }
  }, [fonte]);

  const dados = useMemo(() => serie
    .filter((p) => isNum(p[fonteAtual.idx]))
    .map((p) => ({ t: p[0], pct: p[1], c0: p[fonteAtual.idx], c1: Math.round((100 - p[fonteAtual.idx]) * 100) / 100 })), [serie, fonteAtual]);

  const viradas = useMemo(() => detectarViradas(dados), [dados]);

  const dominio = useMemo(() => {
    let d = 0;
    dados.forEach((p) => {
      d = Math.max(d, Math.abs(p.c0 - 50));
    });
    const meia = Math.min(50, Math.max(2, Math.ceil(d + 1)));
    return [50 - meia, 50 + meia];
  }, [dados]);

  const nome = (i) => candidatos[i]?.nome || t('evolutionChart.candidatoN', { n: i + 1 });
  const fonteLabel = t(fonteAtual.labelKey);

  let resumo = null;
  if (dados.length) {
    const ultima = viradas[viradas.length - 1];
    if (ultima) {
      resumo = (
        <>
          <strong className="text-white">{t('evolutionChart.viradaAs', { hora: fmtHora(ultima.t, false) })}</strong>{' '}
          <span style={{ color: clarear(cores[ultima.lider], 0.3) }} className="font-bold">{nome(ultima.lider)}</span>{t('evolutionChart.passaFrente')}
          {viradas.length > 1 && <span className="text-slate-500">{t('evolutionChart.totalViradas', { n: viradas.length })}</span>}
        </>
      );
    } else {
      const s = dados.map((p) => Math.sign(p.c0 - 50)).find((x) => x !== 0);
      resumo = s == null ? (
        <>{t('evolutionChart.empate')}</>
      ) : (
        <>
          <strong className="text-white">{t('evolutionChart.semVirada')}</strong>{' '}
          <span style={{ color: clarear(cores[s > 0 ? 0 : 1], 0.3) }} className="font-bold">{nome(s > 0 ? 0 : 1)}</span>{t('evolutionChart.lideraDesdeInicio')}
        </>
      );
    }
  }

  const xVirada = (v) => (eixo === 'hora' ? v.t : v.pct);
  const rotular = new Set(viradas.slice(-3)); // só as 3 últimas ganham rótulo, para não embolar

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t('evolutionChart.titulo')}</p>
          <h3 className="truncate text-base sm:text-lg font-black text-white">{titulo || t('evolutionChart.tituloPadrao')}</h3>
          <p className="text-xs text-slate-400">{t('evolutionChart.subtitulo')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seletor}
          <div className="inline-flex rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/10" role="group" aria-label={t('evolutionChart.eixoHorizontal')}>
            {[['hora', t('evolutionChart.eixoHora')], ['pct', t('evolutionChart.eixoPct')]].map(([k, l]) => (
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

      {/* Fonte das linhas (escolha única) */}
      <div className="mt-3 flex w-full rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/10 sm:inline-flex sm:w-auto" role="radiogroup" aria-label={t('evolutionChart.fonteLinhas')}>
        {FONTES.map((f) => {
          const ativo = f.valor === fonte;
          return (
            <button
              key={f.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => setFonte(f.valor)}
              className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm ${ativo ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              {t(f.labelKey)}
            </button>
          );
        })}
      </div>

      {resumo && (
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-300">
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>{resumo}</span>
        </p>
      )}

      {dados.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center" style={{ minHeight: altura - 40 }}>
          <IconeGrafico className="w-7 h-7 text-slate-600" />
          <p className="max-w-sm text-sm text-slate-400">
            {serie.length > 0 && fonte === 'oficial'
              ? t('evolutionChart.vazioSemVotos')
              : t('evolutionChart.vazioAguardando')}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 -ml-2" style={{ height: altura }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.10)" vertical={false} />
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
                  allowDataOverflow
                />
                <ReferenceLine y={50} stroke="#f8fafc" strokeOpacity={0.35} strokeDasharray="2 3" />
                {viradas.map((v, i) => (
                  <ReferenceLine
                    key={`vl-${i}`}
                    x={xVirada(v)}
                    stroke="#f8fafc"
                    strokeOpacity={0.3}
                    strokeDasharray="3 3"
                    label={rotular.has(v) ? {
                      value: t('evolutionChart.rotuloVirada', { hora: fmtHora(v.t, false) }), position: 'top', fill: '#e2e8f0', fontSize: 10, fontWeight: 700,
                    } : undefined}
                  />
                ))}
                <Tooltip
                  content={<DicaGrafico candidatos={candidatos} cores={cores} fonteLabel={fonteLabel} />}
                  cursor={{ stroke: 'rgba(148,163,184,0.35)' }}
                />
                {[0, 1].map((i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={i === 0 ? 'c0' : 'c1'}
                    name={nome(i)}
                    stroke={cores[i]}
                    strokeWidth={2.5}
                    dot={dados.length < 3 ? { r: 3, fill: cores[i] } : false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
                {viradas.map((v, i) => (
                  <ReferenceDot
                    key={`vd-${i}`}
                    x={xVirada(v)}
                    y={50}
                    r={5}
                    fill="#0f172a"
                    stroke="#f8fafc"
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              {[0, 1].map((i) => (
                <span key={i} className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="h-0.5 w-4 shrink-0 rounded" style={{ background: cores[i] }} />
                  <span className="truncate font-semibold" style={{ color: clarear(cores[i], 0.3) }}>{nome(i)}</span>
                </span>
              ))}
              {viradas.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-100 bg-slate-900" /> {t('evolutionChart.legendaVirada')}
                </span>
              )}
            </div>
            <span className="text-slate-500">
              {fonteLabel} · {t('evolutionChart.atualizado')}
              {origem === 'local' ? t('evolutionChart.origemLocal') : origem === 'mock' ? t('evolutionChart.origemMock') : ''}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
