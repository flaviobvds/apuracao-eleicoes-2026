import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building2, Landmark, Loader2, MapPin, Search, X } from 'lucide-react';
import { apiUrl } from './useSegundoTurno';
import { buildMockIndice } from './mockSegundoTurno';
import { UF_NOMES, interpretarBusca, normalizar, siglaUf, tituloMunicipio, zonaSemZeros } from './utils';

const MAX_RESULTADOS = 12;
const GOV_UFS = new Set(['ac', 'am', 'df', 'es', 'rn', 'to']);

let indiceCache = null; // o índice é estático: carrega uma vez por sessão

function prepararIndice(json) {
  const ufs = (Array.isArray(json?.ufs) && json.ufs.length ? json.ufs : Object.keys(UF_NOMES).filter((u) => u !== 'br').map((uf) => ({ uf, nome: UF_NOMES[uf] })))
    .map((u) => ({ uf: String(u.uf).toLowerCase(), nome: u.nome || UF_NOMES[u.uf], norm: normalizar(u.nome || UF_NOMES[u.uf]) }));
  const municipios = (Array.isArray(json?.municipios) ? json.municipios : []).filter((m) => m && m.nome && m.uf).map((m) => ({
    uf: String(m.uf).toLowerCase(),
    cod: String(m.cod ?? ''),
    nome: tituloMunicipio(m.nome),
    norm: normalizar(m.nome),
    capital: Boolean(m.capital),
    zonas: Array.isArray(m.zonas) ? m.zonas.map(String) : [],
    zonasNum: new Set((Array.isArray(m.zonas) ? m.zonas : []).map((z) => parseInt(z, 10))),
    governador: Boolean(m.governador) || GOV_UFS.has(String(m.uf).toLowerCase()),
  }));
  return { ufs, municipios };
}

function buscar(indice, q) {
  const { texto: t0, zona } = interpretarBusca(q);
  if (!t0 && zona == null) return [];
  const ufsTodas = indice?.ufs || [];
  const siglas = new Set(ufsTodas.map((u) => u.uf));
  // sigla de UF solta no texto ("zona 5 sp", "campinas sp")
  let ufFiltro = null;
  const tokens = t0.split(' ').filter(Boolean);
  const resto = [];
  tokens.forEach((tk) => {
    if (!ufFiltro && tk.length === 2 && siglas.has(tk) && (tokens.length > 1 || zona != null)) ufFiltro = tk;
    else resto.push(tk);
  });
  const texto = resto.join(' ');
  const out = [];

  if (zona == null && texto) {
    ufsTodas
      .filter((u) => u.uf === texto || siglaUf(u.uf).toLowerCase() === texto || u.norm.startsWith(texto) || u.norm.includes(` ${texto}`) || (texto.length >= 3 && u.norm.includes(texto)))
      .slice(0, 4)
      .forEach((u) => out.push({ tipo: 'uf', id: `uf-${u.uf}`, uf: u.uf, titulo: u.nome, sub: u.uf === 'zz' ? 'Votos no exterior' : `Estado · ${siglaUf(u.uf)}` }));
  }
  if (zona == null && !texto && ufFiltro) {
    const u = ufsTodas.find((x) => x.uf === ufFiltro);
    if (u) out.push({ tipo: 'uf', id: `uf-${u.uf}`, uf: u.uf, titulo: u.nome, sub: `Estado · ${siglaUf(u.uf)}` });
  }

  const munis = indice?.municipios || [];
  if (zona != null) {
    const cands = munis.filter((m) => m.zonasNum.has(zona)
      && (!ufFiltro || m.uf === ufFiltro)
      && (!texto || m.norm.includes(texto)));
    cands.sort((a, b) => (b.capital - a.capital) || a.nome.localeCompare(b.nome, 'pt-BR'));
    cands.slice(0, MAX_RESULTADOS).forEach((m) => {
      const z = m.zonas.find((x) => parseInt(x, 10) === zona) || String(zona).padStart(4, '0');
      out.push({ tipo: 'zona', id: `z-${m.uf}-${m.cod}-${z}`, uf: m.uf, cargo: 'presidente', mun: m, zona: z, titulo: `Zona ${zonaSemZeros(z)} · ${m.nome} – ${siglaUf(m.uf)}`, sub: 'Presidente · par município × zona' });
      if (m.governador) {
        out.push({ tipo: 'zona', id: `zg-${m.uf}-${m.cod}-${z}`, uf: m.uf, cargo: 'governador', mun: m, zona: z, titulo: `Zona ${zonaSemZeros(z)} · ${m.nome} – ${siglaUf(m.uf)}`, sub: 'Governador · par município × zona' });
      }
    });
  } else if (texto.length >= 2) {
    const comeca = [];
    const contem = [];
    munis.forEach((m) => {
      if (ufFiltro && m.uf !== ufFiltro) return;
      if (m.norm.startsWith(texto)) comeca.push(m);
      else if (texto.length >= 3 && m.norm.includes(texto)) contem.push(m);
    });
    const ord = (a, b) => (b.capital - a.capital) || a.nome.localeCompare(b.nome, 'pt-BR');
    [...comeca.sort(ord), ...contem.sort(ord)].slice(0, MAX_RESULTADOS).forEach((m) => {
      out.push({ tipo: 'municipio', id: `m-${m.uf}-${m.cod}`, uf: m.uf, cargo: 'presidente', mun: m, titulo: `${m.nome} – ${siglaUf(m.uf)}`, sub: m.capital ? 'Capital · Presidente' : 'Município · Presidente' });
      if (m.governador) {
        out.push({ tipo: 'municipio', id: `mg-${m.uf}-${m.cod}`, uf: m.uf, cargo: 'governador', mun: m, titulo: `${m.nome} – ${siglaUf(m.uf)}`, sub: 'Governador' });
      }
    });
  }
  return out.slice(0, MAX_RESULTADOS);
}

const ICONES = { uf: Landmark, municipio: Building2, zona: MapPin };

// Busca global: UFs, municípios e zonas. onAbrir({ cargo, uf, filtro })
export default function BuscaGlobal({ modo, onAbrir }) {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [indice, setIndice] = useState(indiceCache);
  const [carregandoIdx, setCarregandoIdx] = useState(false);
  const [erroIdx, setErroIdx] = useState(null);
  const caixa = useRef(null);
  const ultimaTentativa = useRef(0);
  const listaId = useId();

  const carregarIndice = useCallback(async () => {
    if (indiceCache || carregandoIdx) return;
    if (Date.now() - ultimaTentativa.current < 15000) return;
    ultimaTentativa.current = Date.now();
    setCarregandoIdx(true);
    try {
      let json;
      if (modo?.mock) json = buildMockIndice();
      else {
        const res = await fetch(apiUrl('/indice', null), { cache: 'force-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
        if (!json || json.success === false) throw new Error('resposta inválida');
      }
      indiceCache = prepararIndice(json);
      setIndice(indiceCache);
      setErroIdx(null);
    } catch (e) {
      setErroIdx(e?.message || 'falha');
    } finally {
      setCarregandoIdx(false);
    }
  }, [modo, carregandoIdx]);

  // Fecha ao clicar fora
  useEffect(() => {
    const fora = (e) => {
      if (caixa.current && !caixa.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, []);

  const indiceEfetivo = useMemo(() => indice || prepararIndice(null), [indice]);
  const resultados = useMemo(() => buscar(indiceEfetivo, q), [indiceEfetivo, q]);

  const escolher = (r) => {
    if (!r) return;
    setAberto(false);
    setQ('');
    if (r.tipo === 'uf') {
      onAbrir({ cargo: 'presidente', uf: r.uf, filtro: null });
    } else if (r.tipo === 'municipio') {
      onAbrir({ cargo: r.cargo, uf: r.uf, filtro: { tipo: 'municipios', busca: r.mun.nome, alvoId: r.mun.cod } });
    } else {
      onAbrir({ cargo: r.cargo, uf: r.uf, filtro: { tipo: 'zonas', busca: `${r.mun.nome} zona ${zonaSemZeros(r.zona)}`, alvoId: `${r.mun.cod}-${r.zona}` } });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => Math.min(resultados.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (aberto && resultados[ativo]) {
        e.preventDefault();
        escolher(resultados[ativo]);
      }
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  };

  const mostrar = aberto && q.trim().length > 0;

  return (
    <div ref={caixa} className="relative w-full">
      <label htmlFor={`${listaId}-input`} className="sr-only">Busque seu estado, município ou zona</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        id={`${listaId}-input`}
        type="search"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={`${listaId}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={mostrar && resultados[ativo] ? `${listaId}-${ativo}` : undefined}
        autoComplete="off"
        value={q}
        onChange={(e) => { setQ(e.target.value); setAberto(true); setAtivo(0); carregarIndice(); }}
        onFocus={() => { setAberto(true); carregarIndice(); }}
        onKeyDown={onKeyDown}
        placeholder="Busque seu estado, município ou zona"
        className="h-12 w-full rounded-2xl bg-slate-900/80 pl-11 pr-11 text-[15px] text-white placeholder:text-slate-500 ring-1 ring-white/15 shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {q && (
        <button type="button" onClick={() => { setQ(''); setAtivo(0); }} aria-label="Limpar busca" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}

      {mostrar && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/15 shadow-2xl shadow-black/60">
          <ul id={`${listaId}-lista`} role="listbox" className="max-h-[60vh] overflow-y-auto overscroll-contain py-1">
            {resultados.map((r, i) => {
              const Icone = ICONES[r.tipo] || MapPin;
              return (
                <li
                  key={r.id}
                  id={`${listaId}-${i}`}
                  role="option"
                  aria-selected={i === ativo}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => escolher(r)}
                  onMouseEnter={() => setAtivo(i)}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 ${i === ativo ? 'bg-white/10' : ''}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <Icone className="w-4 h-4 text-slate-300" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{r.titulo}</span>
                    <span className="block truncate text-[11px] text-slate-400">{r.sub}</span>
                  </span>
                  {r.cargo === 'governador' && (
                    <span className="shrink-0 rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-200 ring-1 ring-emerald-400/30">Gov.</span>
                  )}
                </li>
              );
            })}
            {resultados.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-400">
                {carregandoIdx ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando municípios…</span>
                ) : erroIdx && !indice ? (
                  'Busca de municípios indisponível no momento. Estados continuam pesquisáveis.'
                ) : (
                  'Nada encontrado. Tente “Campinas”, “zona 5 SP” ou “Bahia”.'
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
