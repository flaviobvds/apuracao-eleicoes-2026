import React from 'react';
import Modal from './Modal';
import RaceScoreboard from './RaceScoreboard';
import EvolutionChart from './EvolutionChart';
import MunicipiosZonas from './MunicipiosZonas';
import { nomeUf } from './utils';

// Detalhe de uma corrida (UF do Presidente ou Governador) em modal.
export default function RaceModal({
  race, onFechar, data, now, historico, modo, ciclo, filtro, onComoCalculamos,
}) {
  const aberto = Boolean(race);
  const cargo = race?.cargo === 'governador' ? 'governador' : 'presidente';
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={race ? `${cargo === 'governador' ? 'Governador' : 'Presidente'} · ${nomeUf(race.uf, race.nome)}` : ''}
      subtitulo="Placar completo, evolução e municípios"
    >
      {race && (
        <div className="space-y-4 pb-4">
          <RaceScoreboard
            race={race}
            status={data?.status}
            inicioApuracao={data?.inicioApuracao}
            now={now}
            tseDataHora={data?.tseDataHora}
            onComoCalculamos={onComoCalculamos}
          >
            <MunicipiosZonas
              key={`${race.id}-${filtro?.chave || 'x'}`}
              race={race}
              cargo={cargo}
              modo={modo}
              ciclo={ciclo}
              filtroInicial={filtro}
            />
          </RaceScoreboard>
          <EvolutionChart
            race={race}
            historicoLocal={historico?.[race.id]}
            modo={modo}
            ciclo={ciclo}
            titulo={`Evolução · ${nomeUf(race.uf, race.nome)}`}
            altura={220}
          />
        </div>
      )}
    </Modal>
  );
}
