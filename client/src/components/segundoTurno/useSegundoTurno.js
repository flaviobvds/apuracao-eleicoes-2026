import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMockSegundoTurno } from './mockSegundoTurno';
import { isNum, parPct } from './utils';

export const INTERVALO_S = 20;
const MAX_PONTOS = 720;

// Lê ?mock= e ?simular= da URL da página.
export function lerModo() {
  if (typeof window === 'undefined') return { mock: null, simular: null };
  const q = new URLSearchParams(window.location.search);
  const m = (q.get('mock') || '').toLowerCase();
  let mock = null;
  if (m && m !== '0' && m !== 'false') {
    mock = m === 'aguardando' || m === 'encerrada' ? m : 'apurando';
  }
  const s = q.get('simular');
  const simular = s != null && s.trim() !== '' && /^\d{1,3}(\.\d+)?$/.test(s.trim()) ? s.trim() : null;
  return { mock, simular };
}

export function apiUrl(path, modo, extra = {}) {
  const q = new URLSearchParams();
  Object.entries(extra).forEach(([k, v]) => {
    if (v != null) q.set(k, v);
  });
  if (modo?.simular != null) q.set('simular', modo.simular);
  const qs = q.toString();
  return `/api/segundo-turno${path}${qs ? `?${qs}` : ''}`;
}

function chaveHistorico(modo) {
  if (modo.mock) return null; // mock não persiste
  return `segundoTurno2026:historico:v1:${modo.simular != null ? `sim${modo.simular}` : 'real'}`;
}

function carregarHistorico(chave) {
  if (!chave) return {};
  try {
    const raw = window.localStorage.getItem(chave);
    const obj = raw ? JSON.parse(raw) : null;
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function salvarHistorico(chave, hist) {
  if (!chave) return;
  try {
    window.localStorage.setItem(chave, JSON.stringify(hist));
  } catch {
    // sem localStorage (modo privado/cota): segue só em memória
  }
}

function corridasDe(json) {
  const lista = [];
  if (json?.presidente?.nacional) lista.push(json.presidente.nacional);
  if (Array.isArray(json?.presidente?.ufs)) lista.push(...json.presidente.ufs);
  if (Array.isArray(json?.governador)) lista.push(...json.governador);
  return lista.filter((r) => r && r.id);
}

const arred = (v) => (isNum(v) ? Math.round(v * 100) / 100 : null);

// Ponto compacto: [hora(ms), pctSecoes, oficial, metrica1, metrica2] (% do candidato 0)
function anexarPontos(prev, json) {
  const t = Date.parse(json.atualizadoEm) || Date.now();
  const next = { ...prev };
  let mudou = false;
  corridasDe(json).forEach((race) => {
    const pctSecoes = race.apuracao?.pctSecoes;
    if (!isNum(pctSecoes) || pctSecoes <= 0) return;
    const ponto = [
      t,
      arred(pctSecoes),
      arred(parPct(race, 'oficial')[0]),
      arred(parPct(race, 'metrica1')[0]),
      arred(parPct(race, 'metrica2')[0]),
    ];
    const serie = Array.isArray(next[race.id]) ? next[race.id] : [];
    const ult = serie[serie.length - 1];
    if (ult && ult[0] >= t) return;
    if (ult && ult[1] === ponto[1] && ult[2] === ponto[2] && ult[3] === ponto[3] && ult[4] === ponto[4]) return;
    next[race.id] = [...serie, ponto].slice(-MAX_PONTOS);
    mudou = true;
  });
  return mudou ? next : prev;
}

// Histórico sintético para o modo mock (para o gráfico já nascer desenhado).
function historicoMock(pctAtual) {
  let hist = {};
  const agora = Date.now();
  const passos = [3, 6, 10, 15, 20, 25, 30, 35];
  passos.filter((p) => p < pctAtual).forEach((p, i) => {
    const json = buildMockSegundoTurno({ pct: p, now: agora - (passos.length - i) * 4 * 60 * 1000 });
    hist = anexarPontos(hist, json);
  });
  return hist;
}

const MOCK_PCT_INICIAL = { apurando: 40, aguardando: 0, encerrada: 100 };

export function useSegundoTurno() {
  const modo = useMemo(() => lerModo(), []);
  const chave = useMemo(() => chaveHistorico(modo), [modo]);

  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [proximaEm, setProximaEm] = useState(() => Date.now() + INTERVALO_S * 1000);
  const [ciclo, setCiclo] = useState(0);
  const [historico, setHistorico] = useState(() => (
    modo.mock ? historicoMock(MOCK_PCT_INICIAL[modo.mock]) : carregarHistorico(chave)
  ));

  const ultimoCarimbo = useRef(null);
  const emAndamento = useRef(false);
  const mockPct = useRef(MOCK_PCT_INICIAL[modo.mock] ?? 40);
  const proximaRef = useRef(0);

  const buscar = useCallback(async (manual = false) => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    if (manual) setAtualizando(true);
    try {
      let json;
      if (modo.mock) {
        await new Promise((r) => setTimeout(r, 250));
        json = buildMockSegundoTurno({ pct: mockPct.current });
        if (modo.mock === 'apurando') mockPct.current = Math.min(99.5, mockPct.current + 0.9);
      } else {
        const res = await fetch(apiUrl('', modo), { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
        if (!json || json.success === false) throw new Error(json?.error || json?.message || 'resposta inválida');
      }
      setData(json);
      setErro(null);
      if (json.atualizadoEm && json.atualizadoEm !== ultimoCarimbo.current) {
        ultimoCarimbo.current = json.atualizadoEm;
        setHistorico((prev) => anexarPontos(prev, json));
      }
    } catch (e) {
      setErro(e?.message || 'falha de conexão');
    } finally {
      emAndamento.current = false;
      setCarregando(false);
      setCiclo((c) => c + 1);
      if (manual) setAtualizando(false);
    }
  }, [modo]);

  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  }, [buscar]);

  // Persistência do histórico (best effort)
  useEffect(() => {
    salvarHistorico(chave, historico);
  }, [chave, historico]);

  // Primeira carga + relógio de 1 s que dispara a busca a cada INTERVALO_S
  useEffect(() => {
    proximaRef.current = Date.now() + INTERVALO_S * 1000;
    buscarRef.current();
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= proximaRef.current) {
        proximaRef.current = t + INTERVALO_S * 1000;
        setProximaEm(proximaRef.current);
        buscarRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const atualizarAgora = useCallback(() => {
    const t = Date.now();
    proximaRef.current = t + INTERVALO_S * 1000;
    setProximaEm(proximaRef.current);
    setNow(t);
    buscar(true);
  }, [buscar]);

  const contagem = Math.max(0, Math.ceil((proximaEm - now) / 1000));

  return {
    data, erro, carregando, atualizando, contagem, now, ciclo,
    historico, modo, atualizarAgora,
  };
}
