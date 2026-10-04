import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

export default function NationalScoreboard({ nacional }) {
  if (!nacional || !nacional.candidatos) return null;

  const candidatos = nacional.candidatos;
  const liderProjetado = candidatos[0];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header Limpo e Direto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Placar Nacional
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Votos Válidos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Apuração parcial comparada à projeção final a 100% das urnas
          </p>
        </div>

        {/* Líder na Projeção */}
        {liderProjetado && (
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5 font-medium">Líder projetado:</span>
              <strong className="text-white">{liderProjetado.name}</strong>
              <span className="text-emerald-400 font-mono font-bold ml-1.5">
                {liderProjetado.percentualProjetado.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Candidatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidatos.map((c, index) => {
          const isLider = index === 0;
          const delta = c.deltaPercentual;
          const isPositive = delta > 0.05;
          const isNegative = delta < -0.05;

          // Formata o texto de liderança para não quebrar de forma desajeitada
          const formatLideranca = (texto) => {
            if (!texto) return null;
            return texto.replace('(+ Exterior)', '+ Ext.').replace('(Exterior)', 'Ext.');
          };

          return (
            <div
              key={c.id}
              className={`bg-slate-900/80 rounded-xl p-4 border transition-all duration-200 hover:border-slate-500/70 ${
                isLider 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20' 
                  : 'border-slate-800'
              }`}
            >
              {/* Header do Candidato */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-sm shadow shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.number}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-100 text-base leading-tight truncate">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {c.party}
                      </span>
                      {c.textoLideranca && (
                        <span className="text-[11px] text-slate-300 bg-slate-800/90 px-2 py-0.2 rounded border border-slate-700/60 font-medium whitespace-nowrap">
                          Lidera {formatLideranca(c.textoLideranca)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variação (Delta) na Projeção */}
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                    isPositive
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : isNegative
                      ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Variação esperada com as urnas restantes"
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {delta > 0 ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`}
                </span>
              </div>

              {/* Quadro Comparativo Limpo: Atual vs Projeção */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 mb-3">
                {/* Lado 1: Atual */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Atual
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-200 leading-tight">
                    {c.percentualAtual.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {c.votosApurados.toLocaleString('pt-BR')}
                  </div>
                </div>

                {/* Lado 2: Projeção 100% */}
                <div className="border-l border-slate-700/60 pl-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 block">
                    Projeção 100%
                  </span>
                  <div className="text-lg font-extrabold font-mono text-white leading-tight">
                    {c.percentualProjetado.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                    {c.votosProjetados.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Barra Visual Única de Progresso */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, c.percentualProjetado))}%`,
                      backgroundColor: c.color 
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>A apurar estimado:</span>
                  <span className="text-amber-400 font-semibold">
                    +{c.votosRestantesEstimados.toLocaleString('pt-BR')} votos
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
