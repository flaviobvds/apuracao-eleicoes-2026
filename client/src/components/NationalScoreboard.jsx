import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Vote } from 'lucide-react';

export default function NationalScoreboard({ nacional, lastUpdated }) {
  if (!nacional || !nacional.candidatos) return null;

  const candidatos = nacional.candidatos;
  const liderProjetado = candidatos[0];

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-700/80 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Eleição Presidencial 2026
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Votos Válidos Apurados: {nacional.totalVotosValidosApurados.toLocaleString('pt-BR')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Placar Nacional: Apuração Parcial vs. Projeção Final 100%
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Projeção calculada a partir da proporção de votos válidos de cada estado estendida às suas respectivas urnas restantes.
          </p>
        </div>

        {liderProjetado && (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-xl self-start sm:self-auto">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-right sm:text-left">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Líder na Projeção 100%
              </span>
              <span className="text-sm font-bold text-white">
                {liderProjetado.name} <span className="text-xs text-slate-400 font-normal">({liderProjetado.party})</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 ml-1.5">
                {liderProjetado.percentualProjetado.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Banner de Esclarecimento Metodológico: Somente Votos Válidos */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mb-5">
        <div className="flex items-center gap-2 text-indigo-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>
            <strong>Critério Oficial:</strong> Percentuais e projeções calculados <strong>exclusivamente sobre os Votos Válidos</strong> (Art. 77, § 2º da CF). Votos brancos e nulos são desconsiderados.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-slate-300 text-[11px]">
          <span className="text-emerald-400 font-bold">
            Válidos: {nacional.totalVotosValidosApurados.toLocaleString('pt-BR')} ({nacional.percentualValidos || 95.5}%)
          </span>
          {nacional.totalVotosBrancos > 0 && (
            <span className="text-slate-400">
              Brancos: {nacional.totalVotosBrancos.toLocaleString('pt-BR')} ({nacional.percentualBrancos}%)
            </span>
          )}
          {nacional.totalVotosNulos > 0 && (
            <span className="text-slate-400">
              Nulos: {nacional.totalVotosNulos.toLocaleString('pt-BR')} ({nacional.percentualNulos}%)
            </span>
          )}
        </div>
      </div>

      {/* Grid de Candidatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidatos.map((c, index) => {
          const isLider = index === 0;
          const delta = c.deltaPercentual;
          const isPositive = delta > 0.05;
          const isNegative = delta < -0.05;

          return (
            <div
              key={c.id}
              className={`relative bg-slate-900/80 rounded-xl p-4 border transition-all duration-300 hover:border-slate-500/80 ${
                isLider 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20' 
                  : 'border-slate-800'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base leading-snug">
                      {c.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {c.party}
                    </span>
                    {c.textoLideranca && (
                      <span className="text-[11px] text-slate-300 ml-2 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-medium">
                        Lidera {c.textoLideranca}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge de Variação na Projeção */}
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-md border ${
                      isPositive
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : isNegative
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Diferença entre a projeção 100% e o resultado parcial atual"
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : isNegative ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    {delta > 0 ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5 font-sans">
                    impacto urnas pendentes
                  </span>
                </div>
              </div>

              {/* Comparativo de Percentuais */}
              <div className="space-y-3 pt-1">
                {/* 1. Resultado Atual */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">% dos Votos Válidos (Atual)</span>
                    <span className="font-mono font-bold text-slate-200">
                      {c.percentualAtual.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 opacity-60"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, c.percentualAtual))}%`,
                        backgroundColor: c.color 
                      }}
                    />
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono mt-0.5">
                    {c.votosApurados.toLocaleString('pt-BR')} votos válidos
                  </div>
                </div>

                {/* 2. Projeção 100% */}
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-indigo-300 font-semibold flex items-center gap-1">
                      <Vote className="w-3.5 h-3.5" /> Projeção (100% Votos Válidos)
                    </span>
                    <span className="font-mono text-base font-extrabold text-white">
                      {c.percentualProjetado.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-md"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, c.percentualProjetado))}%`,
                        backgroundColor: c.color 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-mono mt-1.5 pt-1 border-t border-slate-700/50">
                    <span className="text-slate-400">Total Projetado:</span>
                    <span className="font-bold text-slate-200">
                      {c.votosProjetados.toLocaleString('pt-BR')} votos
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-300/90 font-mono mt-0.5">
                    <span className="text-slate-400">Votos a Entrar:</span>
                    <span className="font-semibold text-amber-400">
                      +{c.votosRestantesEstimados.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
