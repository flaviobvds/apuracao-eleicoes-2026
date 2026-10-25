import React from 'react';

// Controle segmentado (botões mutuamente exclusivos) com área de toque >= 40 px.
export default function Segmentado({ opcoes, valor, onChange, rotulo, grande = false, className = '' }) {
  return (
    <div
      className={`inline-flex max-w-full rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/10 ${className}`}
      role="group"
      aria-label={rotulo}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => onChange(o.valor)}
            aria-pressed={ativo}
            title={o.titulo}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors ${grande ? 'px-4 text-sm sm:text-base' : 'px-3 text-xs sm:text-sm'} ${ativo ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            {o.icone}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
