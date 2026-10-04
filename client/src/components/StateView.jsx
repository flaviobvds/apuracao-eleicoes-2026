import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, ChevronDown, ChevronUp, Clock, CheckCircle2, Award } from 'lucide-react';
import UrnasBar from './UrnasBar';

export default function StateView({ estados, initialUfFilter = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('TODAS');
  const [sortBy, setSortBy] = useState('urnasRestantes'); // 'urnasRestantes' | 'percentualAsc' | 'percentualDesc' | 'urnasTotal' | 'vantagem'
  const [expandedUf, setExpandedUf] = useState(initialUfFilter);

  // Filtragem e Ordenação
  const estadosFiltrados = useMemo(() => {
    if (!estados) return [];

    return estados
      .filter((st) => {
        const matchesSearch = 
          st.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
          st.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = regionFilter === 'TODAS' || st.region === regionFilter;
        return matchesSearch && matchesRegion;
      })
      .sort((a, b) => {
        if (sortBy === 'urnasRestantes') {
          return b.urnasRestantes - a.urnasRestantes;
        }
        if (sortBy === 'percentualAsc') {
          return a.percentualApurado - b.percentualApurado;
        }
        if (sortBy === 'percentualDesc') {
          return b.percentualApurado - a.percentualApurado;
        }
        if (sortBy === 'urnasTotal') {
          return b.urnasTotal - a.urnasTotal;
        }
        if (sortBy === 'vantagem') {
          return b.vantagem - a.vantagem;
        }
        return 0;
      });
  }, [estados, searchTerm, regionFilter, sortBy]);

  const toggleExpand = (uf) => {
    setExpandedUf(expandedUf === uf ? null : uf);
  };

  return (
    <div className="space-y-5">
      {/* Barra de Filtros, Pesquisa e Ordenação */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por estado ou sigla (ex: SP, Bahia, MG, RJ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Filtro por Região */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="TODAS" className="bg-slate-900">Todas as Regiões</option>
                <option value="SUDESTE" className="bg-slate-900">Sudeste</option>
                <option value="NORDESTE" className="bg-slate-900">Nordeste</option>
                <option value="SUL" className="bg-slate-900">Sul</option>
                <option value="NORTE" className="bg-slate-900">Norte</option>
                <option value="CENTRO_OESTE" className="bg-slate-900">Centro-Oeste</option>
                <option value="EXTERIOR" className="bg-slate-900">Exterior (ZZ)</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="urnasRestantes" className="bg-slate-900">
                  Mais Urnas Restantes (Prioridade)
                </option>
                <option value="percentualAsc" className="bg-slate-900">
                  Menor % Apurado (Mais Atrasado)
                </option>
                <option value="percentualDesc" className="bg-slate-900">
                  Maior % Apurado (Mais Adiantado)
                </option>
                <option value="urnasTotal" className="bg-slate-900">
                  Maior Colégio Eleitoral (Total Urnas)
                </option>
                <option value="vantagem" className="bg-slate-900">
                  Maior Vantagem do Líder
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Informação sobre os resultados filtrados */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700/60">
          <span>
            Exibindo <strong>{estadosFiltrados.length}</strong> de {estados?.length || 28} localidades
          </span>
          <span className="text-amber-400/90 font-medium hidden sm:inline">
            Clique em qualquer estado para ver a decomposição completa de votos e candidatos
          </span>
        </div>
      </div>

      {/* Lista / Tabela Interativa de Estados */}
      <div className="space-y-3">
        {estadosFiltrados.map((st) => {
          const isExpanded = expandedUf === st.uf;
          const lider = st.lider;

          return (
            <div
              key={st.uf}
              className={`bg-slate-800/80 border rounded-xl overflow-hidden transition-all duration-200 ${
                isExpanded 
                  ? 'border-indigo-500/80 ring-1 ring-indigo-500/30 bg-slate-800' 
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Linha Principal do Estado com Grid Perfeitamente Alinhado */}
              <div
                onClick={() => toggleExpand(st.uf)}
                className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-[240px_1fr_210px] items-center gap-4 cursor-pointer hover:bg-slate-700/20 select-none transition-colors"
              >
                {/* Coluna 1: Identificação do Estado (Largura Fixa) */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-bold text-white shadow-sm shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono leading-none">UF</span>
                    <span className="text-sm font-extrabold text-indigo-400 leading-tight">{st.uf}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2 truncate">
                      {st.name}
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700 shrink-0">
                        {st.region}
                      </span>
                    </h4>
                    <span className="text-xs text-slate-400 font-mono block truncate">
                      {st.urnasTotal.toLocaleString('pt-BR')} urnas no total
                    </span>
                  </div>
                </div>

                {/* Coluna 2: Bloco Central de Urnas (Perfeitamente Alinhado em Todas as Linhas) */}
                <div className="w-full min-w-0">
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{st.percentualApurado.toFixed(1)}%</span>
                      <span className="text-slate-400 font-normal hidden sm:inline">({st.urnasApuradas.toLocaleString('pt-BR')})</span>
                    </span>
                    <span className="text-amber-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Faltam {st.urnasRestantes.toLocaleString('pt-BR')} urnas</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/70 rounded-full h-2.5 overflow-hidden flex shadow-inner">
                    <div
                      className="bg-emerald-500 transition-all duration-500 rounded-l-full"
                      style={{ width: `${Math.min(100, Math.max(0, st.percentualApurado))}%` }}
                    />
                    <div
                      className="bg-amber-500/40 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, 100 - st.percentualApurado))}%` }}
                    />
                  </div>
                </div>

                {/* Coluna 3: Líder no Estado e Botão Expandir (Largura Fixa) */}
                <div className="flex items-center justify-between md:justify-end gap-3 min-w-0">
                  {lider && (
                    <div className="text-left md:text-right min-w-0">
                      <div className="flex items-center md:justify-end gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: lider.color }} 
                        />
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {lider.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          {lider.percentualAtual.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Vantagem: +{st.vantagem.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <button 
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Expandir detalhes"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Detalhes Expandidos da UF */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-700/60 bg-slate-900/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">
                      Simulação no Estado de {st.name} (mantendo proporções atuais para 100% das urnas):
                    </span>
                    <span className="text-slate-400 font-mono">
                      Votos válidos apurados: {st.totalVotosValidosApurados.toLocaleString('pt-BR')} | 
                      Votos finais projetados: {st.totalVotosValidosProjetados.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Tabela de Candidatos no Estado */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="pb-2 font-medium">Candidato</th>
                          <th className="pb-2 font-medium text-right">Votos Apurados</th>
                          <th className="pb-2 font-medium text-right">% Atual no Estado</th>
                          <th className="pb-2 font-medium text-right text-emerald-400">Votos Projetados (100%)</th>
                          <th className="pb-2 font-medium text-right text-amber-400">Votos a Entrar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {st.candidatos.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-800/40">
                            <td className="py-2 flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="font-semibold text-slate-100">{c.name}</span>
                              <span className="text-[10px] text-slate-400">({c.party})</span>
                              {idx === 0 && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                                  1º LUGAR
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right font-mono text-slate-300">
                              {c.votosApurados.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-100">
                              {c.percentualAtual.toFixed(2)}%
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400">
                              {c.votosProjetados.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold text-amber-400">
                              +{c.votosRestantesEstimados.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
