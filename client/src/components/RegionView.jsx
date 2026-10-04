import React, { useState } from 'react';
import { MapPin, BarChart3, Clock, CheckCircle2, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import UrnasBar from './UrnasBar';

export default function RegionView({ regioes, onSelectState }) {
  const [selectedRegionId, setSelectedRegionId] = useState(null);

  if (!regioes || regioes.length === 0) return null;

  // Preparar dados para o gráfico de urnas por região
  const chartDataUrnas = regioes.map(r => ({
    name: r.name,
    'Urnas Apuradas': r.urnasApuradas,
    'Urnas Restantes': r.urnasRestantes,
    total: r.urnasTotal,
    percentual: r.percentualApurado
  }));

  // Preparar dados para o gráfico de impacto de votos restantes
  const chartDataVotosPendentes = regioes.map(r => {
    const item = { name: r.name };
    r.candidatos.forEach(c => {
      item[c.name] = c.votosRestantesEstimados;
    });
    return item;
  });

  return (
    <div className="space-y-6">
      {/* Banner Explicativo da Visão Regional */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-800/60 to-slate-800/40 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-1">
            <Layers className="w-3.5 h-3.5" /> Visão Agregada por Região
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Distribuição de Urnas e Projeção por Macrorregiões
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-0.5">
            Compare quais regiões já totalizaram mais urnas e onde estão concentradas as urnas restantes que definirão o resultado final da Presidência.
          </p>
        </div>
      </div>

      {/* Gráfico Comparativo de Urnas Apuradas vs Restantes */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Comparativo de Urnas por Região: Apuradas vs. Restantes
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Valores absolutos de seções eleitorais
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataUrnas} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [`${value.toLocaleString('pt-BR')} urnas`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="Urnas Apuradas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Urnas Restantes" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards das 6 Regiões */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {regioes.map((reg) => {
          const isExpanded = selectedRegionId === reg.id;
          const lider = reg.lider;

          return (
            <div
              key={reg.id}
              className={`bg-slate-800/90 border rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between ${
                isExpanded ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div>
                {/* Header da Região */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-3.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: reg.color }}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                        {reg.name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {reg.estadosCount} {reg.estadosCount === 1 ? 'localidade' : 'estados'}
                      </span>
                    </div>
                  </div>

                  {/* Peso no saldo nacional de urnas restantes */}
                  <div className="text-right bg-slate-900/80 border border-slate-700/60 rounded-lg px-2.5 py-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      Urnas Pendentes
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {reg.pesoUrnasRestantesNacional.toFixed(1)}% do Brasil
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso de Urnas */}
                <div className="mb-4">
                  <UrnasBar 
                    total={reg.urnasTotal}
                    apuradas={reg.urnasApuradas}
                    restantes={reg.urnasRestantes}
                    percentual={reg.percentualApurado}
                    compact={true}
                  />
                </div>

                {/* Líder Regional */}
                {lider && (
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Liderança Regional
                      </span>
                      <span className="text-sm font-bold text-slate-100">
                        {lider.name} <span className="text-xs text-slate-400">({lider.party})</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-emerald-400 block">
                        {lider.percentualProjetado.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        votos válidos na região
                      </span>
                    </div>
                  </div>
                )}

                {/* Tabela de Candidatos na Região */}
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Votos Válidos na Região: Atual vs. Projetado
                  </span>
                  {reg.candidatos.slice(0, 3).map((c) => (
                    <div 
                      key={c.id} 
                      className="bg-slate-900/40 rounded-lg p-2 text-xs flex items-center justify-between border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-semibold text-slate-200">{c.name}</span>
                        <span className="text-[10px] text-slate-400">({c.party})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-400" title="Percentual Parcial Atual">
                          Atual: <strong className="text-slate-200">{c.percentualAtual.toFixed(1)}%</strong>
                        </span>
                        <span className="text-emerald-400 font-bold" title="Percentual Projetado a 100%">
                          Proj: {c.percentualProjetado.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-amber-400 font-semibold" title="Votos a entrar nesta região">
                          (+{(c.votosRestantesEstimados / 1000).toFixed(0)}k)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lista de Estados da Região */}
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="flex flex-wrap gap-1.5">
                    {reg.estados.map((st) => (
                      <button
                        key={st.uf}
                        onClick={() => onSelectState && onSelectState(st.uf)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 text-slate-300 border border-slate-700/70 hover:border-indigo-500 hover:text-white transition-colors"
                        title={`${st.name}: ${st.percentualApurado}% apurado (${st.urnasRestantes.toLocaleString('pt-BR')} urnas restantes)`}
                      >
                        <span className="font-bold">{st.uf}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {st.percentualApurado.toFixed(0)}%
                        </span>
                      </button>
                    ))}
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
