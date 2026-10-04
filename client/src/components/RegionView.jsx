import React, { useState } from 'react';
import { BarChart3, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import UrnasBar from './UrnasBar';

export default function RegionView({ regioes, onSelectState }) {
  if (!regioes || regioes.length === 0) return null;

  // Preparar dados para o gráfico de urnas por região
  const chartDataUrnas = regioes.map(r => ({
    name: r.name,
    'Urnas Apuradas': r.urnasApuradas,
    'Urnas Restantes': r.urnasRestantes,
    total: r.urnasTotal,
    percentual: r.percentualApurado
  }));

  return (
    <div className="space-y-6">
      {/* Header Limpo da Seção */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Apuração por Região
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Distribuição das 534.671 urnas pelas macrorregiões e Exterior
        </span>
      </div>

      {/* Gráfico Comparativo de Urnas Apuradas vs Restantes */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Urnas Apuradas vs. Restantes por Região
            </h3>
          </div>
        </div>

        <div className="h-60 sm:h-64 w-full">
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

      {/* Cards das Regiões (Layout Limpo, Sem Quebras) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {regioes.map((reg) => {
          return (
            <div
              key={reg.id}
              className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header da Região */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-3 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: reg.color }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {reg.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {reg.estadosCount} {reg.estadosCount === 1 ? 'localidade' : 'estados'}
                      </span>
                    </div>
                  </div>

                  {/* Urnas Restantes */}
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 block">
                      {reg.urnasRestantes.toLocaleString('pt-BR')} restantes
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reg.pesoUrnasRestantesNacional.toFixed(1)}% do saldo nacional
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

                {/* Tabela de Candidatos Limpa e Alinhada */}
                <div className="space-y-1.5 mb-4">
                  {/* Cabeçalho da Tabelinha */}
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 pb-1 border-b border-slate-700/50">
                    <span>Candidato</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="w-12 text-right">Atual</span>
                      <span className="w-12 text-right text-indigo-300">Projeção</span>
                    </div>
                  </div>

                  {/* Linhas de Candidatos */}
                  {reg.candidatos.slice(0, 3).map((c, idx) => (
                    <div 
                      key={c.id} 
                      className="bg-slate-900/60 rounded-lg px-2.5 py-2 text-xs flex items-center justify-between border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      {/* Nome e Partido */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-semibold text-slate-100 text-xs truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {c.party}
                        </span>
                      </div>

                      {/* Números em Colunas Fixas para Evitar Quebras */}
                      <div className="flex items-center gap-3 font-mono shrink-0">
                        <span className="text-slate-300 text-xs w-12 text-right">
                          {c.percentualAtual.toFixed(1)}%
                        </span>
                        <span className="font-bold text-white text-xs w-12 text-right">
                          {c.percentualProjetado.toFixed(1)}%
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
                        title={`${st.name}: ${st.percentualApurado.toFixed(1)}% apurado (${st.urnasRestantes.toLocaleString('pt-BR')} urnas restantes)`}
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
