import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Landmark, Loader2, RefreshCw, Vote } from 'lucide-react';
import { useSegundoTurno } from './useSegundoTurno';
import SimulacaoBanner from './SimulacaoBanner';
import StatusBar from './StatusBar';
import BuscaGlobal from './BuscaGlobal';
import Segmentado from './Segmentado';
import RaceScoreboard from './RaceScoreboard';
import EvolutionChart from './EvolutionChart';
import UfGrid from './UfGrid';
import GovernadoresView from './GovernadoresView';
import RaceModal from './RaceModal';
import MetodologiaModal from './MetodologiaModal';
import { candidatosDe, nomeUf } from './utils';

function Esqueleto() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-80 rounded-3xl bg-slate-900/70 ring-1 ring-white/5" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-900/70 ring-1 ring-white/5" />)}
      </div>
    </div>
  );
}

export default function SegundoTurnoPage({ onStatus }) {
  const {
    data, erro, carregando, atualizando, contagem, now, ciclo, historico, modo, atualizarAgora,
  } = useSegundoTurno();
  const [aba, setAba] = useState('presidente');
  const [metodologia, setMetodologia] = useState(false);
  const [detalhe, setDetalhe] = useState(null); // { id, filtro }
  const [graficoId, setGraficoId] = useState('presidente-br');

  const status = data?.status || null;
  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Segundo turno 2026 · Apuração e projeções';
    return () => {
      document.title = anterior;
    };
  }, []);

  const nacional = data?.presidente?.nacional || null;
  const ufs = useMemo(() => (Array.isArray(data?.presidente?.ufs) ? data.presidente.ufs.filter(Boolean) : []), [data]);
  const governador = useMemo(() => (Array.isArray(data?.governador) ? data.governador.filter(Boolean) : []), [data]);

  const todas = useMemo(() => {
    const m = new Map();
    if (nacional?.id) m.set(nacional.id, nacional);
    ufs.forEach((r) => r.id && m.set(r.id, r));
    governador.forEach((r) => r.id && m.set(r.id, r));
    return m;
  }, [nacional, ufs, governador]);

  const corridaDetalhe = detalhe ? todas.get(detalhe.id) || null : null;
  const corridaGrafico = todas.get(graficoId) || nacional;

  const abrirCorrida = useCallback((race) => {
    if (race?.id) setDetalhe({ id: race.id, filtro: null });
  }, []);

  const abrirBusca = useCallback(({ cargo, uf, filtro }) => {
    const id = `${cargo}-${uf}`;
    setDetalhe({ id, filtro: filtro ? { ...filtro, chave: Date.now() } : null });
  }, []);

  const abrirMetodologia = useCallback(() => setMetodologia(true), []);

  const opcoesGrafico = useMemo(() => {
    const lista = [];
    if (nacional) lista.push({ id: nacional.id, nome: 'Brasil' });
    [...ufs]
      .sort((a, b) => nomeUf(a.uf, a.nome).localeCompare(nomeUf(b.uf, b.nome), 'pt-BR'))
      .forEach((r) => lista.push({ id: r.id, nome: nomeUf(r.uf, r.nome) }));
    return lista;
  }, [nacional, ufs]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
      <SimulacaoBanner modo={modo} simulacao={data?.simulacao} />

      {/* Cabeçalho da página + busca global */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300">Eleições 2026 · 25 de outubro</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Segundo turno</h1>
          <p className="mt-1 text-sm text-slate-400">Apuração oficial do TSE e duas projeções para 100% das urnas.</p>
        </div>
        <div className="w-full lg:max-w-md">
          <BuscaGlobal modo={modo} onAbrir={abrirBusca} />
        </div>
      </div>

      <StatusBar data={data} erro={erro} contagem={contagem} atualizando={atualizando} onAtualizar={atualizarAgora} />

      {carregando && !data ? (
        <>
          <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Carregando a apuração do 2º turno…</p>
          <Esqueleto />
        </>
      ) : !data ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-center">
          <AlertTriangle className="mx-auto w-8 h-8 text-rose-300" />
          <p className="mt-2 font-bold text-white">Não foi possível carregar os dados do 2º turno.</p>
          <p className="mt-1 text-sm text-rose-200/80">Tentaremos de novo automaticamente em {contagem}s.</p>
          <button type="button" onClick={atualizarAgora} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950">
            <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} /> Tentar agora
          </button>
        </div>
      ) : (
        <>
          <Segmentado
            rotulo="Cargo"
            grande
            className="w-full sm:w-auto"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { valor: 'presidente', label: 'Presidente', icone: <Vote className="w-4 h-4" /> },
              { valor: 'governadores', label: `Governadores${governador.length ? ` (${governador.length})` : ''}`, icone: <Landmark className="w-4 h-4" /> },
            ]}
          />

          {aba === 'presidente' ? (
            <div className="space-y-6 sm:space-y-8">
              {nacional ? (
                <RaceScoreboard
                  variante="hero"
                  race={nacional}
                  status={data.status}
                  inicioApuracao={data.inicioApuracao}
                  now={now}
                  tseDataHora={data.tseDataHora}
                  onComoCalculamos={abrirMetodologia}
                />
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">Placar nacional indisponível.</p>
              )}

              {corridaGrafico && (
                <EvolutionChart
                  serie={historico?.[corridaGrafico.id]}
                  candidato={candidatosDe(corridaGrafico)[0]}
                  titulo={`Presidente · ${nomeUf(corridaGrafico.uf, corridaGrafico.nome)}`}
                  seletor={opcoesGrafico.length > 1 ? (
                    <select
                      value={corridaGrafico.id}
                      onChange={(e) => setGraficoId(e.target.value)}
                      aria-label="Corrida exibida no gráfico"
                      className="h-10 max-w-[11rem] rounded-xl bg-slate-950/60 px-3 text-sm text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {opcoesGrafico.map((o) => <option key={o.id} value={o.id} className="bg-slate-900">{o.nome}</option>)}
                    </select>
                  ) : null}
                />
              )}

              <UfGrid ufs={ufs} onAbrir={abrirCorrida} />
            </div>
          ) : (
            <GovernadoresView
              corridas={governador}
              data={data}
              now={now}
              historico={historico}
              modo={modo}
              ciclo={ciclo}
              onComoCalculamos={abrirMetodologia}
              onAbrir={abrirCorrida}
            />
          )}
        </>
      )}

      <RaceModal
        race={corridaDetalhe}
        onFechar={() => setDetalhe(null)}
        data={data}
        now={now}
        historico={historico}
        modo={modo}
        ciclo={ciclo}
        filtro={detalhe?.filtro || null}
        onComoCalculamos={abrirMetodologia}
      />
      {/* Depois do detalhe, para ficar por cima quando aberto a partir dele */}
      <MetodologiaModal aberto={metodologia} onFechar={() => setMetodologia(false)} />
    </div>
  );
}
