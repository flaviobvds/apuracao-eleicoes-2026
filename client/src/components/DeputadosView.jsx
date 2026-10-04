import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  UserX, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

export default function DeputadosView() {
  const [cargo, setCargo] = useState('federal'); // 'federal' | 'estadual'
  const [selectedUf, setSelectedUf] = useState('SP');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPartidos, setExpandedPartidos] = useState(new Set());

  // Buscar dados da API
  const fetchDeputados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deputados?uf=${selectedUf}&cargo=${cargo}`);
      if (!res.ok) {
        throw new Error(`Erro na API (${res.status}): ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
      // Expandir automaticamente os 2 primeiros partidos com mais vagas
      if (json.partidos && json.partidos.length > 0) {
        const initialExpanded = new Set();
        if (json.partidos[0]) initialExpanded.add(json.partidos[0].sigla);
        if (json.partidos[1]) initialExpanded.add(json.partidos[1].sigla);
        setExpandedPartidos(initialExpanded);
      }
    } catch (err) {
      console.error('Erro ao carregar deputados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedUf, cargo]);

  useEffect(() => {
    fetchDeputados();
  }, [fetchDeputados]);

  const toggleExpand = (sigla) => {
    setExpandedPartidos(prev => {
      const next = new Set(prev);
      if (next.has(sigla)) {
        next.delete(sigla);
      } else {
        next.add(sigla);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!data?.partidos) return;
    setExpandedPartidos(new Set(data.partidos.map(p => p.sigla)));
  };

  const collapseAll = () => {
    setExpandedPartidos(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Cargo & Seletor de UF */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Seletor de Cargo */}
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setCargo('federal')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  cargo === 'federal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deputado Federal (Câmara)
              </button>
              <button
                onClick={() => setCargo('estadual')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  cargo === 'estadual'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {selectedUf === 'DF' ? 'Deputado Distrital (CLDF)' : 'Deputado Estadual (Assembleia)'}
              </button>
            </div>
          </div>

          {/* Seletor de UF */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Estado:
            </span>
            <select
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              {UFS.map((uf) => (
                <option key={uf} value={uf} className="bg-slate-900 font-bold">
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chips de Acesso Rápido a UFs (Todas as 27 UFs em Ordem Alfabética) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos:</span>
          {UFS.map((uf) => (
            <button
              key={uf}
              onClick={() => setSelectedUf(uf)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedUf === uf
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-700/70 hover:border-slate-500 hover:text-white'
              }`}
            >
              {uf}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-12 text-center shadow-xl">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">
            Calculando vagas proporcionais do TSE para {selectedUf}...
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Processando votos nominais, Quociente Eleitoral (QE), Quociente Partidário (QP) e Sobras D'Hondt
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold">Falha ao calcular vagas da UF</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Conteúdo Principal quando carregado */}
      {data && !loading && (
        <>
          {/* Card Resumo do Estado e Quociente Eleitoral */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    UF: {data.uf}
                  </span>
                  <span className="text-xs text-slate-400">
                    {data.casaLegislativa}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {data.cargoNome} — {data.uf}
                </h2>
              </div>

              {/* Urnas Apuradas */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 flex items-center gap-3 self-start md:self-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Apuração na UF
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {data.urnasInfo.percentualApurado}% apurado
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {data.urnasInfo.urnasApuradas?.toLocaleString('pt-BR')} de {data.urnasInfo.urnasTotal?.toLocaleString('pt-BR')} seções
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de Métricas Oficiais Proporcionais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total de Vagas */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Vagas em Disputa
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
                  {data.totalVagas}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  100% distribuídas
                </span>
              </div>

              {/* Quociente Eleitoral (QE) */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Quociente Eleitoral (QE)
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {data.quocienteEleitoral.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Votos válidos / Vagas
                </span>
              </div>

              {/* Votação Mínima Individual (10% do QE) */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Cláusula Individual (QP)
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-200">
                  {data.minVotosNominaisQP.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Mínimo de 10% do QE
                </span>
              </div>

              {/* Votos Válidos Totais */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Total de Votos Válidos
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                  {data.totalVotosValidos.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Nominais + Legenda
                </span>
              </div>
            </div>
          </div>

          {/* Título da Seção de Bancadas e Controles de Expansão */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Bancadas Eleitas por Partido / Federação
              </h3>
              <p className="text-xs text-slate-400">
                Ordenado por número total de vagas conquistadas (Quociente Partidário + Sobras)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer font-medium"
              >
                Expandir Todos
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer font-medium"
              >
                Recolher Todos
              </button>
            </div>
          </div>

          {/* Lista de Partidos Ordenados por Vagas */}
          <div className="space-y-4">
            {data.partidos.map((partido, index) => {
              const isExpanded = expandedPartidos.has(partido.sigla);
              const temVagas = partido.totalVagas > 0;

              return (
                <div
                  key={partido.sigla}
                  className={`bg-slate-800/90 border rounded-2xl overflow-hidden transition-all shadow-lg ${
                    temVagas
                      ? 'border-slate-700/80 hover:border-slate-600'
                      : 'border-slate-800/60 opacity-80'
                  }`}
                >
                  {/* Cabeçalho do Partido (Sempre Visível e Clicável) */}
                  <div
                    onClick={() => toggleExpand(partido.sigla)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/20 select-none transition-colors"
                  >
                    {/* Identificação do Partido */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex items-center justify-center font-mono font-bold text-xs text-slate-400 w-6 shrink-0">
                        #{index + 1}
                      </div>

                      <div
                        className="w-3.5 h-10 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: partido.color }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-base sm:text-lg tracking-tight truncate">
                            {partido.sigla}
                          </h4>
                          {partido.numero && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                              {partido.numero}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-md">
                          {partido.nome}
                        </p>
                      </div>
                    </div>

                    {/* Votos do Partido & Vagas */}
                    <div className="flex items-center justify-between md:justify-end gap-5 shrink-0">
                      {/* Votação */}
                      <div className="text-left md:text-right">
                        <span className="text-sm font-bold font-mono text-slate-200 block">
                          {partido.votosTotais.toLocaleString('pt-BR')} votos
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {partido.percentualValidos}% dos válidos
                        </span>
                      </div>

                      {/* BADGE DE VAGAS CONQUISTADAS */}
                      <div className={`px-4 py-2 rounded-xl border text-center min-w-[130px] ${
                        temVagas
                          ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                          : 'bg-slate-900 border-slate-700/60 text-slate-500'
                      }`}>
                        <div className="text-lg sm:text-xl font-black font-mono text-white leading-none">
                          {partido.totalVagas} {partido.totalVagas === 1 ? 'VAGA' : 'VAGAS'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {partido.vagasQP} QP • {partido.vagasSobras} {partido.vagasSobras === 1 ? 'Sobra' : 'Sobras'}
                        </div>
                      </div>

                      {/* Ícone de Expansão */}
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo Expandido: Candidatos Entrando vs Ficando de Fora */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-700/60 bg-slate-900/60 space-y-5">
                      
                      {/* 1. CANDIDATOS QUE ESTÃO ENTRANDO (ELEITOS) */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4" />
                            Candidatos que estão Entrando ({partido.candidatosEntrando.length} eleitos)
                          </span>
                        </div>

                        {partido.candidatosEntrando.length === 0 ? (
                          <div className="bg-slate-900/80 rounded-xl p-4 text-xs text-slate-400 border border-slate-800 text-center">
                            Nenhum candidato eleito por esta legenda na UF até o momento.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {partido.candidatosEntrando.map((cand, idx) => (
                              <div
                                key={cand.id || cand.numero}
                                className="bg-slate-900/90 border border-emerald-900/40 hover:border-emerald-700/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-800/40">
                                    {idx + 1}º
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-100 text-sm truncate">
                                      {cand.nomeUrna}
                                    </h5>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                      <span className="font-mono">{cand.numero}</span>
                                      {cand.partidoOrigem && cand.partidoOrigem !== partido.sigla && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                          {cand.partidoOrigem}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold font-mono text-slate-200 block">
                                    {cand.votosNominais.toLocaleString('pt-BR')} votos
                                  </span>
                                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 border ${
                                    cand.tipoVaga === 'QP'
                                      ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                                      : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                                  }`}>
                                    {cand.tipoVaga === 'QP' ? 'Eleito por QP' : 'Eleito por Média'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. CANDIDATOS QUE ESTÃO FICANDO DE FORA (SUPLENTES IMEDIATOS) */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UserX className="w-4 h-4 text-rose-400" />
                            Candidatos que estão Ficando de Fora (Próximos Suplentes)
                          </span>
                        </div>

                        {partido.candidatosFicandoDeFora.length === 0 ? (
                          <div className="bg-slate-900/80 rounded-xl p-3 text-xs text-slate-400 border border-slate-800 text-center">
                            Não há outros candidatos registrados nesta legenda.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {partido.candidatosFicandoDeFora.map((cand, idx) => (
                              <div
                                key={cand.id || cand.numero}
                                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                                    {idx + 1}º
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-300 text-sm truncate">
                                      {cand.nomeUrna}
                                    </h5>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                      <span className="font-mono">{cand.numero}</span>
                                      {cand.partidoOrigem && cand.partidoOrigem !== partido.sigla && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                                          {cand.partidoOrigem}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-mono text-slate-300 block">
                                    {cand.votosNominais.toLocaleString('pt-BR')} votos
                                  </span>
                                  {cand.diferencaParaEntrar && cand.diferencaParaEntrar > 0 && (
                                    <span className="text-[10px] text-rose-400 font-mono block mt-0.5">
                                      Faltou {cand.diferencaParaEntrar.toLocaleString('pt-BR')} votos
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
