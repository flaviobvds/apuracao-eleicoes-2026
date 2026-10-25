import React from 'react';
import { candidatosDe, clarear, coresCorrida, fmtPct, fmtPp, isNum, nomeUf, parPct, siglaUf } from './utils';

// Cartão compacto de uma UF na grade do Presidente.
export default function UfCard({ race, metrica = 'metrica2', onAbrir }) {
  const cands = candidatosDe(race);
  const cores = coresCorrida(race);
  const [p0, p1] = parPct(race, metrica);
  const ok = isNum(p0) && isNum(p1);
  const lider = ok ? (p0 >= p1 ? 0 : 1) : null;
  const margem = ok ? Math.abs(p0 - p1) : null;
  const pct = race?.apuracao?.pctSecoes;

  return (
    <button
      type="button"
      onClick={() => onAbrir?.(race)}
      className="group min-w-0 w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-left transition-colors hover:border-white/25 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      aria-label={`${nomeUf(race.uf, race.nome)}: ${ok ? `${cands[lider]?.nome} lidera com ${fmtPct(lider === 0 ? p0 : p1)}` : 'sem dados'}, ${fmtPct(pct)} apurado. Abrir detalhe`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-black leading-none tracking-tight text-white">{siglaUf(race.uf)}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">{nomeUf(race.uf, race.nome)}</div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="text-xs font-bold tabular-nums text-slate-200">{fmtPct(pct, 1)}</div>
          <div className="text-[10px] text-slate-500">apurado</div>
        </div>
      </div>

      <div className="relative mt-2.5" aria-hidden="true">
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-800">
          {ok && (
            <>
              <div className="absolute inset-y-0 left-0 transition-[width] duration-700" style={{ width: `${p0}%`, background: cores[0] }} />
              <div className="absolute inset-y-0 right-0 transition-[width] duration-700" style={{ width: `${p1}%`, background: cores[1] }} />
            </>
          )}
        </div>
        <div className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px -translate-x-1/2 bg-white/80" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {ok ? (
          <>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cores[lider] }} />
              <span className="truncate font-semibold text-slate-100">{cands[lider]?.nome}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums" style={{ color: clarear(cores[lider], 0.3) }}>
              {fmtPct(lider === 0 ? p0 : p1, 1)}
            </span>
          </>
        ) : (
          <span className="text-slate-500">aguardando</span>
        )}
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-500 tabular-nums">
        <span>{ok ? `margem ${fmtPp(margem, 1)}` : ' '}</span>      </div>
    </button>
  );
}
