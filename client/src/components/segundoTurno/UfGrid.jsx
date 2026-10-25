import React, { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import UfCard from './UfCard';
import Segmentado from './Segmentado';
import { isNum, nomeUf, parPct } from './utils';

const ORDENS = [
  { valor: 'nome', label: 'UF', padrao: 'asc', titulo: 'Ordenar pelo nome da UF' },
  { valor: 'apurado', label: '% apurado', padrao: 'desc', titulo: 'Ordenar pelo % de seções apuradas' },
  { valor: 'margem', label: 'Margem', padrao: 'asc', titulo: 'Ordenar pela margem entre os candidatos' },
];

const METRICAS_GRADE = [
  { valor: 'oficial', label: 'Oficial', titulo: 'Apurado (TSE)' },
  { valor: 'metrica1', label: 'M1', titulo: 'Métrica 1 · Proporção do 1º turno' },
  { valor: 'metrica2', label: 'M2', titulo: 'Métrica 2 · Tempo real' },
];

export default function UfGrid({ ufs, onAbrir, metricaInicial = 'metrica2' }) {
  const [ordem, setOrdem] = useState('nome');
  const [direcao, setDirecao] = useState('asc');
  const [metrica, setMetrica] = useState(metricaInicial);

  const lista = useMemo(() => {
    const arr = (Array.isArray(ufs) ? ufs : []).filter(Boolean).map((r) => {
      const [a, b] = parPct(r, metrica);
      return {
        race: r,
        nome: nomeUf(r.uf, r.nome),
        apurado: isNum(r.apuracao?.pctSecoes) ? r.apuracao.pctSecoes : null,
        margem: isNum(a) && isNum(b) ? Math.abs(a - b) : null,
      };
    });
    const mult = direcao === 'asc' ? 1 : -1;
    arr.sort((x, y) => {
      if (ordem === 'nome') {
        // Exterior sempre no fim na ordem alfabética
        if (x.race.uf === 'zz') return 1;
        if (y.race.uf === 'zz') return -1;
        return x.nome.localeCompare(y.nome, 'pt-BR') * mult;
      }
      const vx = x[ordem];
      const vy = y[ordem];
      if (vx == null && vy == null) return x.nome.localeCompare(y.nome, 'pt-BR');
      if (vx == null) return 1;
      if (vy == null) return -1;
      return (vx - vy) * mult || x.nome.localeCompare(y.nome, 'pt-BR');
    });
    return arr;
  }, [ufs, ordem, direcao, metrica]);

  const trocarOrdem = (v) => {
    if (v === ordem) {
      setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setOrdem(v);
    setDirecao(ORDENS.find((o) => o.valor === v)?.padrao || 'asc');
  };

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Presidente por UF</p>
          <h3 className="text-lg sm:text-xl font-black text-white">27 estados + Exterior</h3>
          <p className="text-xs text-slate-400">Toque num cartão para ver o placar completo da UF.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmentado
            rotulo="Métrica exibida na grade"
            opcoes={METRICAS_GRADE}
            valor={metrica}
            onChange={setMetrica}
          />
          <div className="flex items-center gap-1">
            <Segmentado rotulo="Ordenar por" opcoes={ORDENS} valor={ordem} onChange={trocarOrdem} />
            <button
              type="button"
              onClick={() => setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/60 text-slate-300 ring-1 ring-white/10 hover:text-white"
              aria-label={direcao === 'asc' ? 'Ordem crescente (inverter)' : 'Ordem decrescente (inverter)'}
              title={direcao === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              {direcao === 'asc' ? <ArrowUpNarrowWide className="w-4 h-4" /> : <ArrowDownWideNarrow className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Barras: {METRICAS_GRADE.find((m) => m.valor === metrica)?.titulo}. Linha branca = 50%.
      </p>

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">Sem dados por UF ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {lista.map(({ race }) => (
            <UfCard key={race.id || race.uf} race={race} metrica={metrica} onAbrir={onAbrir} />
          ))}
        </div>
      )}
    </section>
  );
}
