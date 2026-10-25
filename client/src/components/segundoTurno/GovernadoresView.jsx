import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import RaceScoreboard from './RaceScoreboard';
import EvolutionChart from './EvolutionChart';
import MunicipiosZonas from './MunicipiosZonas';
import { candidatosDe, nomeUf } from './utils';

// Aba "Governadores": 6 corridas com o placar de três linhas + evolução da corrida selecionada.
export default function GovernadoresView({ corridas, data, now, historico, modo, ciclo, onComoCalculamos, onAbrir }) {
  const lista = Array.isArray(corridas) ? corridas.filter(Boolean) : [];
  const [selecionada, setSelecionada] = useState(null);
  const atual = lista.find((r) => r.id === selecionada) || lista[0];

  if (lista.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
        Sem dados de governador ainda.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {lista.map((race) => (
          <RaceScoreboard
            key={race.id}
            race={race}
            status={data?.status}
            inicioApuracao={data?.inicioApuracao}
            now={now}
            tseDataHora={data?.tseDataHora}
            acoes={(
              <button
                type="button"
                onClick={() => onAbrir(race)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                aria-label={`Abrir detalhe de ${nomeUf(race.uf, race.nome)}`}
                title="Abrir em tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          >
            <MunicipiosZonas race={race} cargo="governador" modo={modo} ciclo={ciclo} />
          </RaceScoreboard>
        ))}
      </div>

      {atual && (
        <EvolutionChart
          serie={historico?.[atual.id]}
          candidato={candidatosDe(atual)[0]}
          titulo={`Governador · ${nomeUf(atual.uf, atual.nome)}`}
          seletor={(
            <select
              value={atual.id}
              onChange={(e) => setSelecionada(e.target.value)}
              aria-label="Corrida exibida no gráfico"
              className="h-10 rounded-xl bg-slate-950/60 px-3 text-sm text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {lista.map((r) => <option key={r.id} value={r.id} className="bg-slate-900">{nomeUf(r.uf, r.nome)}</option>)}
            </select>
          )}
        />
      )}
      {onComoCalculamos && (
        <p className="text-center text-xs text-slate-400">
          Para governador, o swing da Métrica 2 é calculado só dentro do próprio estado.{' '}
          <button type="button" onClick={onComoCalculamos} className="min-h-10 font-semibold text-indigo-300 underline underline-offset-2 hover:text-white">
            Como calculamos
          </button>
        </p>
      )}
    </div>
  );
}
