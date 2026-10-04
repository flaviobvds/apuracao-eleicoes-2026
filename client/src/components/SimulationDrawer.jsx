import React, { useState } from 'react';
import { Sliders, Play, Pause, FastForward, Users, Sparkles, Server, Check, X, ShieldCheck } from 'lucide-react';

export default function SimulationDrawer({
  currentScenario,
  scenariosAvailable = [],
  onSelectScenario,
  onAdvanceStep,
  isAutoAdvancing,
  onToggleAutoAdvance,
  source,
  onToggleSource,
  tseStatus,
  roundMode = '1',
  onSelectRound,
  activeCandidates = [],
  onUpdateCandidates
}) {
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificador e Alternador de Fonte */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Painel de Controle Eleitoral 2026
              </h4>
              <p className="text-xs text-slate-400">
                Somente candidatos à Presidência da República
              </p>
            </div>
          </div>

          {/* Seletor de Turno */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => onSelectRound('1')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                roundMode === '1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="1º Turno com todos os candidatos a Presidente"
            >
              1º Turno (Todos)
            </button>
            <button
              onClick={() => onSelectRound('2')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                roundMode === '2'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2º Turno: Disputa Direta Lula vs Flávio Bolsonaro"
            >
              2º Turno (Lula vs Bolsonaro)
            </button>
          </div>

          {/* Toggle TSE Oficial vs Simulador */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => onToggleSource('simulacao')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                source === 'simulacao'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulador
            </button>
            <button
              onClick={() => onToggleSource('tse')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                source === 'tse'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              TSE Oficial
            </button>
          </div>

          {source === 'tse' && !tseStatus?.available && (
            <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
              TSE em pré-eleição (usando dados simulados)
            </span>
          )}
        </div>

        {/* Lado Direito: Ações Rápidas de Simulação */}
        {source === 'simulacao' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Ver Candidatos Presidenciais */}
            <button
              onClick={() => setShowCandidatesModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Presidenciáveis ({activeCandidates.length})
            </button>

            {/* Seletor de Cenários */}
            <select
              value={currentScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              {scenariosAvailable.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-slate-900">
                  {sc.name}
                </option>
              ))}
            </select>

            {/* Avançar Urnas Manualmente */}
            <button
              onClick={() => onAdvanceStep(0.02)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Avança aproximadamente +2% nas urnas de todas as regiões"
            >
              <FastForward className="w-3.5 h-3.5 text-indigo-400" />
              +2% Urnas
            </button>

            {/* Play/Pause Auto-Avanço */}
            <button
              onClick={onToggleAutoAdvance}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                isAutoAdvancing
                  ? 'bg-amber-600/20 text-amber-300 border-amber-600/40 hover:bg-amber-600/30'
                  : 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40 hover:bg-emerald-600/30'
              }`}
            >
              {isAutoAdvancing ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pausar Ticker
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Simular Noite Eleitoral
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Candidatos à Presidência */}
      {showCandidatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Candidatos à Presidência da República 2026
                </h3>
              </div>
              <button
                onClick={() => setShowCandidatesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              A simulação considera exclusivamente os candidatos registrados para Presidente da República nas Eleições de 2026.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeCandidates.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                      <span className="text-xs text-slate-400">
                        Partido: <strong className="text-slate-300">{c.party}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    Ativo na Simulação
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCandidatesModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
