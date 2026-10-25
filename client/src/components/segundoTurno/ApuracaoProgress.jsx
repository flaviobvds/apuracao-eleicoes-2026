import React from 'react';
import { fmtDec, isNum } from './utils';

// Anel de progresso da apuração (% de seções apuradas).
export default function ApuracaoProgress({ pct, tamanho = 112, espessura = 10, rotulo = 'seções apuradas' }) {
  const valor = isNum(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const completo = valor >= 100;

  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} role="img" aria-label={`${fmtDec(valor)}% das ${rotulo}`}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={completo ? '#34d399' : 'url(#gradAnelST)'}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - valor / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        <defs>
          <linearGradient id="gradAnelST" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className={`font-black tabular-nums text-white ${tamanho >= 100 ? 'text-2xl' : 'text-base'}`}>
          {fmtDec(valor, valor >= 100 ? 0 : 2)}%
        </span>
        {tamanho >= 100 && (
          <span className="mt-1 max-w-[62%] text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-400">
            {rotulo}
          </span>
        )}
      </div>
    </div>
  );
}
