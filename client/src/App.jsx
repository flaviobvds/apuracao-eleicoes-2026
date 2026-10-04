import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderNav from './components/HeaderNav';
import UrnasBar from './components/UrnasBar';
import NationalScoreboard from './components/NationalScoreboard';
import RegionView from './components/RegionView';
import StateView from './components/StateView';
import SimulationDrawer from './components/SimulationDrawer';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('regiao'); // 'regiao' | 'estado'
  const [targetUf, setTargetUf] = useState(null);

  // Controles de Auto-Refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // segundos
  const [countdown, setCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-avanço da Simulação
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef(null);

  // Carregar dados da API
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

  // Fetch inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ciclo de contagem regressiva para Auto-Refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Ciclo de Auto-Avanço da Simulação (Noite da Eleição Ticker)
  useEffect(() => {
    if (!isAutoAdvancing) {
      if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
      return;
    }

    autoAdvanceTimerRef.current = setInterval(async () => {
      try {
        await fetch('/api/simulation/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta: 0.02 })
        });
        fetchData();
      } catch (err) {
        console.error('Erro ao avançar simulação:', err);
      }
    }, 2500);

    return () => {
      if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    };
  }, [isAutoAdvancing, fetchData]);

  // Ações de Simulação
  const handleSelectScenario = async (scenarioId) => {
    try {
      await fetch('/api/simulation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      fetchData(true);
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Erro ao alterar cenário:', err);
    }
  };

  const handleAdvanceStep = async (delta = 0.02) => {
    try {
      await fetch('/api/simulation/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      fetchData(true);
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Erro ao avançar passo:', err);
    }
  };

  const handleToggleAutoAdvance = () => {
    setIsAutoAdvancing(prev => !prev);
  };

  const handleToggleSource = async (source) => {
    try {
      await fetch('/api/config/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      fetchData(true);
    } catch (err) {
      console.error('Erro ao trocar fonte:', err);
    }
  };

  const handleSelectRound = async (roundMode) => {
    try {
      await fetch('/api/simulation/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundMode })
      });
      fetchData(true);
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Erro ao alternar turno:', err);
    }
  };

  const handleSelectStateFromRegion = (uf) => {
    setTargetUf(uf);
    setViewMode('estado');
  };

  const handleManualRefresh = () => {
    fetchData(true);
    setCountdown(refreshInterval);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-4 animate-bounce">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white">Carregando Dados de Apuração 2026...</h2>
        <p className="text-sm text-slate-400 mt-1">Conectando aos dados de seções e urnas do Brasil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de Navegação Superior */}
      <HeaderNav
        viewMode={viewMode}
        onChangeViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'regiao') setTargetUf(null);
        }}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(prev => !prev)}
        refreshInterval={refreshInterval}
        onChangeRefreshInterval={(sec) => {
          setRefreshInterval(sec);
          setCountdown(sec);
        }}
        countdown={countdown}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={data?.lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Banner de Erro caso a API falhe */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-3.5 flex items-center gap-3 text-sm text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Aviso de conexão: {error}. Exibindo dados em cache/simulação local.</span>
          </div>
        )}

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

        {/* 3. Painel de Controle de Simulação */}
        <SimulationDrawer
          currentScenario={data?.currentScenario}
          scenariosAvailable={data?.scenariosAvailable}
          onSelectScenario={handleSelectScenario}
          onAdvanceStep={handleAdvanceStep}
          isAutoAdvancing={isAutoAdvancing}
          onToggleAutoAdvance={handleToggleAutoAdvance}
          source={data?.source}
          onToggleSource={handleToggleSource}
          tseStatus={data?.tseStatus}
          roundMode={data?.roundMode}
          onSelectRound={handleSelectRound}
          activeCandidates={data?.activeCandidates || []}
        />

        {/* 4. Conteúdo Alternável: Visão por Região vs Visão por Estado */}
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
      </main>

      {/* Rodapé Metodológico */}
      <footer className="bg-slate-900/90 border-t border-slate-800/80 py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">
              Metodologia de Projeção a 100% dos Votos Válidos
            </p>
            <p className="mt-0.5 text-slate-400">
              Calculada multiplicando a taxa de votos válidos de cada candidato observada em cada UF/região pelo saldo total de urnas restantes da mesma localidade.
            </p>
          </div>
          <div className="text-right text-slate-400">
            <span>Eleições Gerais 2026 • Presidente da República</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
