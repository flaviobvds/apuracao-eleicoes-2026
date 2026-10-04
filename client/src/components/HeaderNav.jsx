import React from 'react';
import { RefreshCw, Radio, Layers, MapPin, Clock, Vote } from 'lucide-react';

export default function HeaderNav({
  viewMode,
  onChangeViewMode,
  autoRefresh,
  onToggleAutoRefresh,
  refreshInterval,
  onChangeRefreshInterval,
  countdown,
  onManualRefresh,
  isRefreshing,
  lastUpdated
}) {
  const formattedTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Eleições Presidenciais 2026
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulador de Urnas e Projeção a 100% dos Votos Válidos
              </p>
            </div>
          </div>

          {/* Abas Centrais de Visão: Estado vs Região */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => onChangeViewMode('regiao')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'regiao'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Visão por Região
            </button>
            <button
              onClick={() => onChangeViewMode('estado')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'estado'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Visão por Estado (UF)
            </button>
          </div>

          {/* Controles de Atualização Automática */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-medium">
                Última Atualização
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {formattedTime}
              </span>
            </div>

            {/* Configuração de Auto-Refresh */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <button
                onClick={onToggleAutoRefresh}
                className={`flex items-center gap-1 font-semibold transition-colors ${
                  autoRefresh ? 'text-emerald-400' : 'text-slate-400'
                }`}
                title={autoRefresh ? 'Pausar auto-atualização' : 'Ativar auto-atualização'}
              >
                <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
                {autoRefresh ? (
                  <span>Auto: {countdown}s</span>
                ) : (
                  <span>Pausado</span>
                )}
              </button>

              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => onChangeRefreshInterval(Number(e.target.value))}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer border-l border-slate-700 pl-1.5 text-[11px]"
                >
                  <option value={5} className="bg-slate-900">5s</option>
                  <option value={10} className="bg-slate-900">10s</option>
                  <option value={30} className="bg-slate-900">30s</option>
                </select>
              )}
            </div>

            {/* Botão Manual de Atualizar */}
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Atualizar dados agora"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
