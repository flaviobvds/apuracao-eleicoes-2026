import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from './useSegundoTurno';
import { buildMockHistorico } from './mockSegundoTurno';
import { isNum } from './utils';

const MINUTO = 60000;

function pontoValido(p) {
  return Array.isArray(p) && isNum(p[0]);
}

// Pontos do servidor + pontos locais mais novos que o último do servidor, 1 por minuto (fica o mais recente).
export function mesclarHistorico(servidor, local) {
  const s = (Array.isArray(servidor) ? servidor : []).filter(pontoValido);
  const l = (Array.isArray(local) ? local : []).filter(pontoValido);
  const ultimoServidor = s.length ? Math.max(...s.map((p) => p[0])) : -Infinity;
  const todos = [...s, ...l.filter((p) => p[0] > ultimoServidor)].sort((a, b) => a[0] - b[0]);
  const porMinuto = new Map();
  todos.forEach((p) => {
    porMinuto.set(Math.floor(p[0] / MINUTO), p);
  });
  return [...porMinuto.values()];
}

// Histórico da corrida selecionada: servidor (minuto a minuto) com fallback no histórico local.
// Não chama o servidor em ?simular=NN; em ?mock=1 usa um histórico sintético local.
export function useHistoricoServidor(race, { modo, ciclo, historicoLocal }) {
  const id = race?.id || null;
  const [servidor, setServidor] = useState({ id: null, pontos: null });
  const raceRef = useRef(race);
  useEffect(() => {
    raceRef.current = race;
  }, [race]);

  const simulando = modo?.simular != null;
  const mock = Boolean(modo?.mock);

  useEffect(() => {
    if (!id || simulando) return undefined;
    let cancelado = false;
    const carregar = async () => {
      try {
        let pontos = null;
        if (mock) {
          await Promise.resolve();
          pontos = buildMockHistorico(raceRef.current, Date.now());
        } else {
          const res = await fetch(apiUrl('/historico', null, { corrida: id }), { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const ok = json && json.success !== false && json.disponivel !== false
            && Array.isArray(json.pontos) && (json.corrida == null || json.corrida === id);
          pontos = ok ? json.pontos : null;
        }
        if (!cancelado) setServidor({ id, pontos });
      } catch {
        // erro de rede: mantém o que já veio do servidor para esta corrida (ou cai no local)
        if (!cancelado) setServidor((prev) => (prev.id === id ? prev : { id, pontos: null }));
      }
    };
    carregar();
    return () => {
      cancelado = true;
    };
  }, [id, ciclo, simulando, mock]);

  return useMemo(() => {
    const srv = servidor.id === id && Array.isArray(servidor.pontos) && servidor.pontos.length ? servidor.pontos : null;
    return {
      serie: mesclarHistorico(srv, historicoLocal),
      fonte: srv ? (mock ? 'mock' : 'servidor') : 'local',
    };
  }, [servidor, id, historicoLocal, mock]);
}
