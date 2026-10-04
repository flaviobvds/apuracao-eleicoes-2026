import React from 'react';
import { CheckCircle2, Clock, Box } from 'lucide-react';

export default function UrnasBar({ 
  total = 0, 
  apuradas = 0, 
  restantes = 0, 
  percentual = 0,
  title = "Progresso Nacional das Urnas",
  subtitle = null,
  compact = false 
}) {
  const percentualRestante = total > 0 ? (restantes / total) * 100 : 0;

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {percentual.toFixed(1)}% apurado ({apuradas.toLocaleString('pt-BR')})
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {restantes.toLocaleString('pt-BR')} restantes ({percentualRestante.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-500 rounded-l-full"
            style={{ width: `${Math.min(100, Math.max(0, percentual))}%` }}
          />
          <div 
            className="bg-amber-500/40 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, percentualRestante))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Total:</span>
            <strong className="text-white font-mono">{total.toLocaleString('pt-BR')}</strong>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Bicolor */}
      <div className="w-full bg-slate-700/60 rounded-full h-3.5 overflow-hidden flex shadow-inner">
        <div 
          className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 rounded-l-full relative group"
          style={{ width: `${Math.min(100, Math.max(0, percentual))}%` }}
        />
        <div 
          className="bg-gradient-to-r from-amber-500/50 to-amber-600/60 transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, percentualRestante))}%` }}
        />
      </div>

      {/* Cards de Métricas lado a lado */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-200">Urnas Apuradas</span>
          </div>
          <div className="text-right">
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-300">
              {apuradas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-semibold text-emerald-400 ml-1.5 font-mono">
              ({percentual.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-200">Urnas Restantes</span>
          </div>
          <div className="text-right">
            <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
              {restantes.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-semibold text-amber-400 ml-1.5 font-mono">
              ({percentualRestante.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
