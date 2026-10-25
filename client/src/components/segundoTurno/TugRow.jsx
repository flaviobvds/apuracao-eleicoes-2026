import React from 'react';
import { useI18n } from '../../i18n/useI18n';
import { clarear, fmtPct, fmtPp, isNum } from './utils';

function primeiroNome(c) {
  const n = c?.nome || '';
  return n.split(/\s+/)[0] || n;
}

// Uma linha do "cabo de guerra": % de cada candidato, barra dividida com marca em 50% e diferença em p.p.
export default function TugRow({
  label,
  valores = [null, null],
  cores,
  candidatos = [],
  destaque = false,
  vazio,
  tag = null,
  compacto = false,
}) {
  const { t } = useI18n();
  const vazioTxt = vazio === undefined ? t('tugRow.aguardandoDados') : vazio;
  const [p0, p1] = valores;
  const ok = isNum(p0) && isNum(p1);
  const dif = ok ? p0 - p1 : null;
  const lider = ok ? (dif > 0 ? 0 : dif < 0 ? 1 : null) : null;
  const corLider = lider != null ? clarear(cores[lider], 0.3) : '#cbd5e1';
  const alturaBarra = destaque ? 'h-5 sm:h-6' : compacto ? 'h-2.5' : 'h-3 sm:h-3.5';
  const tamNum = destaque
    ? 'text-lg sm:text-2xl'
    : compacto ? 'text-sm' : 'text-base sm:text-lg';

  return (
    <div className={destaque ? 'rounded-xl bg-white/[0.03] ring-1 ring-white/10 px-3 py-2.5 -mx-1 sm:-mx-3 sm:px-3' : ''}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className={`truncate font-semibold ${destaque ? 'text-slate-100 text-xs sm:text-sm' : 'text-slate-400 text-[11px] sm:text-xs'} uppercase tracking-wide`}>
          {label}
        </span>
        {ok ? (
          <span className="shrink-0 text-[11px] sm:text-xs font-semibold tabular-nums" style={{ color: corLider }}>
            {lider == null ? t('tugRow.empate') : `+${fmtPp(Math.abs(dif))} ${primeiroNome(candidatos[lider])}`}
          </span>
        ) : tag ? (
          <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/30 rounded-full px-2 py-0.5">
            {tag}
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center gap-2 sm:gap-3">
        <span
          className={`${compacto ? 'w-14' : 'w-[4.5rem] sm:w-24'} shrink-0 text-left font-extrabold tabular-nums ${tamNum}`}
          style={{ color: ok ? clarear(cores[0], 0.25) : '#64748b' }}
        >
          {ok ? fmtPct(p0) : '—'}
        </span>
        <div className="relative flex-1 min-w-0" aria-hidden="true">
          <div className={`relative ${alturaBarra} rounded-full overflow-hidden bg-slate-800/80`}>
            {ok ? (
              <>
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                  style={{ width: `${p0}%`, background: cores[0] }}
                />
                <div
                  className="absolute inset-y-0 right-0 transition-[width] duration-700 ease-out"
                  style={{ width: `${p1}%`, background: cores[1] }}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.12)_0_6px,transparent_6px_12px)]" />
            )}
          </div>
          <div className="absolute left-1/2 -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded bg-white/90 shadow-[0_0_0_2px_rgba(2,6,23,0.6)]" />
        </div>
        <span
          className={`${compacto ? 'w-14' : 'w-[4.5rem] sm:w-24'} shrink-0 text-right font-extrabold tabular-nums ${tamNum}`}
          style={{ color: ok ? clarear(cores[1], 0.25) : '#64748b' }}
        >
          {ok ? fmtPct(p1) : '—'}
        </span>
      </div>
      {!ok && !tag && vazioTxt && (
        <p className="mt-1 text-[11px] text-slate-500">{vazioTxt}</p>
      )}
      <span className="sr-only">
        {ok
          ? `${label}: ${candidatos[0]?.nome} ${fmtPct(p0)}, ${candidatos[1]?.nome} ${fmtPct(p1)}`
          : `${label}: ${tag || vazioTxt}`}
      </span>
    </div>
  );
}
