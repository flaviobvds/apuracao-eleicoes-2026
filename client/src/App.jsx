import React, { useState, useEffect, useCallback } from 'react';
import HeaderNav from './components/HeaderNav';
import UrnasBar from './components/UrnasBar';
import NationalScoreboard from './components/NationalScoreboard';
import RegionView from './components/RegionView';
import StateView from './components/StateView';
import DeputadosView from './components/DeputadosView';
import SegundoTurnoPage from './components/segundoTurno/SegundoTurnoPage';
import SobreDesenvolvedor from './components/SobreDesenvolvedor';
import { AlertCircle, RefreshCw } from 'lucide-react';

function isSegundoTurno(value) {
  return /segundo-?turno|2-?turno/.test(value);
}

// O 2º turno é a página inicial; 1º turno (/primeiro-turno) e deputados (/deputados) seguem nas suas URLs.
function getPageFromLocation() {
  if (typeof window === 'undefined') return 'segundo-turno';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const pageParam = (search.get('page') || search.get('pagina') || '').toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (isSegundoTurno(path) || isSegundoTurno(pageParam) || isSegundoTurno(hash)) {
    return 'segundo-turno';
  }
  if (path.includes('deputado') || pageParam.includes('deputado') || hash.includes('deputado')) {
    return 'deputados';
  }
  const primeiroTurno = /primeiro-?turno|1-?turno|presidente/;
  if (primeiroTurno.test(path) || primeiroTurno.test(pageParam) || primeiroTurno.test(hash)) {
    return 'presidente';
  }
  return 'segundo-turno';
}

export default function App() {
  const [activePage, setActivePage] = useState(getPageFromLocation);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('regiao'); // 'regiao' | 'estado'
  const [targetUf, setTargetUf] = useState(null);

  // Escutar botões de Voltar / Avançar do navegador
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage === activePage) return;
    setActivePage(newPage);
    if (newPage === 'segundo-turno') {
      // preserva só os parâmetros de teste da página do 2º turno
      const atual = new URLSearchParams(window.location.search);
      const q = new URLSearchParams();
      ['mock', 'simular'].forEach((k) => {
        if (atual.get(k)) q.set(k, atual.get(k));
      });
      const qs = q.toString();
      window.history.pushState({ page: 'segundo-turno' }, '', `/${qs ? `?${qs}` : ''}`);
      window.scrollTo(0, 0);
    } else if (newPage === 'deputados') {
      const search = window.location.search;
      window.history.pushState({ page: 'deputados' }, '', `/deputados${search}`);
    } else {
      window.history.pushState({ page: 'presidente' }, '', '/primeiro-turno');
    }
  };

  // 1º turno encerrado: os dados são finais, sem atualização automática (só o botão manual)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carregar dados da API (Padrão Oficial TSE)
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const response = await fetch('/api/apuracao');
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Falha ao carregar apuração:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Status do 2º turno (para o selo "AO VIVO" no menu)
  const [segundoTurnoStatus, setSegundoTurnoStatus] = useState(null);

  // Fetch inicial (a página do 2º turno tem a sua própria API)
  useEffect(() => {
    if (activePage === 'segundo-turno') return;
    fetchData();
  }, [fetchData, activePage]);

  const handleSelectStateFromRegion = (uf) => {
    setTargetUf(uf);
    setViewMode('estado');
  };

  const handleManualRefresh = () => {
    fetchData(true);
  };

  if (activePage === 'segundo-turno') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-clip">
        <HeaderNav
          activePage={activePage}
          onChangePage={handlePageChange}
          segundoTurnoStatus={segundoTurnoStatus}
        />
        <main className="flex-1 w-full">
          <SegundoTurnoPage onStatus={setSegundoTurnoStatus} />
        </main>
        <footer className="bg-slate-900/90 border-t border-slate-800/80 py-6 text-xs text-slate-400 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p>
              Fonte: API pública de divulgação de resultados do TSE (resultados.tse.jus.br). Projeções são estimativas
              estatísticas, não resultados oficiais.
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-slate-500">Eleições Gerais 2026 • 2º turno</span>
              <SobreDesenvolvedor />
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-4 animate-bounce">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white">Carregando Apuração TSE 2026...</h2>
        <p className="text-sm text-slate-400 mt-1">Conectando aos dados de seções e urnas do Brasil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de Navegação Superior */}
      <HeaderNav
        activePage={activePage}
        onChangePage={handlePageChange}
        segundoTurnoStatus={segundoTurnoStatus}
        viewMode={viewMode}
        onChangeViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'regiao') setTargetUf(null);
        }}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={data?.lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Banner de Erro caso a API falhe */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-3.5 flex items-center gap-3 text-sm text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Aviso de conexão: {error}.</span>
          </div>
        )}

        {/* Renderização Condicional da Página Selecionada */}
        {activePage === 'presidente' ? (
          <>
            {/* 1. Barra Nacional de Urnas (Foco Central: Urnas Apuradas vs Restantes) */}
            {data?.nacional && (
              <UrnasBar
                total={data.nacional.urnasTotal}
                apuradas={data.nacional.urnasApuradas}
                restantes={data.nacional.urnasRestantes}
                percentual={data.nacional.percentualApurado}
                title="Apuração Nacional das Urnas"
              />
            )}

            {/* 2. Placar Nacional: Resultado Parcial Atual vs Projeção Final 100% */}
            <NationalScoreboard
              nacional={data?.nacional}
              lastUpdated={data?.lastUpdated}
            />

            {/* 3. Conteúdo Alternável: Visão por Região vs Visão por Estado */}
            {viewMode === 'regiao' ? (
              <RegionView
                regioes={data?.regioes}
                onSelectState={handleSelectStateFromRegion}
              />
            ) : (
              <StateView
                estados={data?.estados}
                initialUfFilter={targetUf}
              />
            )}
          </>
        ) : (
          /* PÁGINA DE DEPUTADOS FEDERAIS E ESTADUAIS */
          <DeputadosView />
        )}
      </main>

      {/* Rodapé */}
      <footer className="bg-slate-900/90 border-t border-slate-800/80 py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">
              {activePage === 'presidente' 
                ? 'Projeção 100% dos Votos Válidos (Presidente)'
                : 'Cálculo Proporcional do TSE (Deputados Federais e Estaduais)'}
            </p>
            <p className="mt-0.5 text-slate-400">
              {activePage === 'presidente'
                ? 'Cálculo baseado nos dados oficiais do TSE aplicados às seções eleitorais restantes de cada localidade.'
                : 'Aplicação das regras do Código Eleitoral: Quociente Eleitoral (QE), Quociente Partidário (QP) e Sobras D\'Hondt.'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-right text-slate-400">
            <span>Eleições Gerais 2026 • Dados Oficiais TSE</span>
            <SobreDesenvolvedor />
          </div>
        </div>
      </footer>
    </div>
  );
}
