import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Loader2, MapPinned, Search, WifiOff, X } from 'lucide-react';
import Segmentado from './Segmentado';
import { useI18n } from '../../i18n/useI18n';
import { tr } from '../../i18n/estado';
import { apiUrl } from './useSegundoTurno';
import { buildMockUfDetalhe } from './mockSegundoTurno';
import {
  clarear, coresCorrida, fmtNum, fmtPct, fmtPp, interpretarBusca, isNum, normalizar, tituloMunicipio, zonaSemZeros,
} from './utils';

const PAGINA = 100;

const ORDENS = [
  { valor: 'eleitorado', chave: 'municipiosZonas.ordemEleitorado', padrao: 'desc' },
  { valor: 'nome', chave: 'municipiosZonas.ordemNome', padrao: 'asc' },
  { valor: 'apurado', chave: 'municipiosZonas.ordemApurado', padrao: 'desc' },
  { valor: 'dif', chave: 'municipiosZonas.ordemDif', padrao: 'desc' },
];

function MiniBarra({ pct, cores }) {
  useI18n();
  const ok = isNum(pct);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative h-2 flex-1 min-w-[48px]" aria-hidden="true">
        <div className="relative h-full overflow-hidden rounded-full bg-slate-800">
          {ok && (
            <>
              <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: cores[0] }} />
              <div className="absolute inset-y-0 right-0" style={{ width: `${100 - pct}%`, background: cores[1] }} />
            </>
          )}
        </div>
        <div className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px -translate-x-1/2 bg-white/80" />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-200">{ok ? fmtPct(pct, 1) : '—'}</span>
    </div>
  );
}

function Dif({ v, cores }) {
  useI18n();
  if (!isNum(v)) return <span className="text-slate-500">—</span>;
  const cor = v > 0 ? clarear(cores[0], 0.3) : v < 0 ? clarear(cores[1], 0.3) : '#cbd5e1';
  return <span className="whitespace-nowrap font-bold tabular-nums" style={{ color: cor }}>{fmtPp(v, 2, true)}</span>;
}

function NomeLinha({ l, modoZonas }) {
  const { t } = useI18n();
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-semibold text-slate-100" title={l.nomeFmt}>{l.nomeFmt}</span>
      {modoZonas && l.zona != null && (
        <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10">
          {t('municipiosZonas.zona', { n: zonaSemZeros(l.zona) })}
        </span>
      )}
      {l.capital && (
        <span className="shrink-0 rounded-md bg-indigo-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200 ring-1 ring-indigo-400/30">
          {t('municipiosZonas.capital')}
        </span>
      )}
    </span>
  );
}

export default function MunicipiosZonas({ race, cargo, modo, ciclo, filtroInicial = null }) {
  const { t } = useI18n();
  const uf = race?.uf;
  const [aberto, setAberto] = useState(Boolean(filtroInicial));
  const [tipo, setTipo] = useState(filtroInicial?.tipo || 'municipios');
  const [busca, setBusca] = useState(filtroInicial?.busca || '');
  const [ordem, setOrdem] = useState('eleitorado');
  const [direcao, setDirecao] = useState('desc');
  const [limite, setLimite] = useState(PAGINA);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const raiz = useRef(null);
  // race muda a cada ciclo; guardamos em ref para o ciclo comandar a recarga
  const raceRef = useRef(race);
  useEffect(() => {
    raceRef.current = race;
  }, [race]);

  // Carrega sob demanda ao abrir e recarrega junto com o ciclo de 20 s.
  useEffect(() => {
    if (!aberto || !uf) return undefined;
    let cancelado = false;
    const carregar = async () => {
      setCarregando(true);
      try {
        let json;
        if (modo?.mock) {
          await new Promise((r) => setTimeout(r, 200));
          const r = raceRef.current;
          const pctMock = r?.apuracao?.pctSecoes;
          json = buildMockUfDetalhe(uf, cargo, isNum(pctMock) ? pctMock : 40, r);
        } else {
          const res = await fetch(apiUrl(`/uf/${encodeURIComponent(uf)}`, modo, { cargo }), { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          json = await res.json();
          if (!json || json.success === false) throw new Error(json?.error || tr('municipiosZonas.respostaInvalida'));
        }
        if (!cancelado) {
          setDados(json);
          setErro(null);
        }
      } catch (e) {
        if (!cancelado) setErro(e?.message || tr('municipiosZonas.falhaConexao'));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };
    carregar();
    return () => {
      cancelado = true;
    };
  }, [aberto, uf, cargo, ciclo, modo]);

  useEffect(() => {
    if (filtroInicial && raiz.current) {
      const tm = setTimeout(() => raiz.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(tm);
    }
    return undefined;
  }, [filtroInicial]);

  const candidatos = Array.isArray(dados?.candidatos) && dados.candidatos.length === 2 ? dados.candidatos : race?.candidatos || [];
  const cores = coresCorrida(candidatos, cargo);

  const linhasBase = useMemo(() => {
    const fonte = tipo === 'zonas' ? dados?.pares : dados?.municipios;
    return (Array.isArray(fonte) ? fonte : []).filter(Boolean).map((l) => ({
      ...l,
      nomeFmt: tituloMunicipio(l.municipio),
      norm: normalizar(l.municipio),
      zonaNum: l.zona != null ? parseInt(l.zona, 10) : null,
      t1pct: isNum(l.t1?.pct) ? l.t1.pct : null,
      t2pct: isNum(l.t2?.pct) ? l.t2.pct : null,
    }));
  }, [dados, tipo]);

  // municípios -> zonas (para buscar município por número de zona)
  const zonasPorMunicipio = useMemo(() => {
    const m = new Map();
    (Array.isArray(dados?.pares) ? dados.pares : []).forEach((p) => {
      if (!p?.codMunicipio) return;
      const z = parseInt(p.zona, 10);
      if (!m.has(p.codMunicipio)) m.set(p.codMunicipio, new Set());
      if (!Number.isNaN(z)) m.get(p.codMunicipio).add(z);
    });
    return m;
  }, [dados]);

  const filtradas = useMemo(() => {
    const { texto, zona } = interpretarBusca(busca.replace(/\bzone\b/gi, 'zona'));
    let arr = linhasBase;
    if (texto) arr = arr.filter((l) => l.norm.includes(texto));
    if (zona != null) {
      arr = arr.filter((l) => (tipo === 'zonas'
        ? l.zonaNum === zona
        : zonasPorMunicipio.get(l.codMunicipio || l.id)?.has(zona)));
    }
    const mult = direcao === 'asc' ? 1 : -1;
    const chave = { eleitorado: 'eleitorado', apurado: 'pctApurado', dif: 'difPp' }[ordem];
    return [...arr].sort((a, b) => {
      if (ordem === 'nome') {
        return (a.nomeFmt.localeCompare(b.nomeFmt, 'pt-BR') || (a.zonaNum || 0) - (b.zonaNum || 0)) * mult;
      }
      const va = isNum(a[chave]) ? a[chave] : null;
      const vb = isNum(b[chave]) ? b[chave] : null;
      if (va == null && vb == null) return a.nomeFmt.localeCompare(b.nomeFmt, 'pt-BR');
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va - vb) * mult || a.nomeFmt.localeCompare(b.nomeFmt, 'pt-BR');
    });
  }, [linhasBase, busca, tipo, ordem, direcao, zonasPorMunicipio]);

  const visiveis = filtradas.slice(0, limite);
  const alvo = filtroInicial?.alvoId;
  const nomeC0 = candidatos[0]?.nome || t('municipiosZonas.candidato1');

  const mudarOrdem = (v) => {
    setOrdem(v);
    setDirecao(ORDENS.find((o) => o.valor === v)?.padrao || 'desc');
    setLimite(PAGINA);
  };

  return (
    <div ref={raiz} className="mt-5 border-t border-white/10 pt-4 scroll-mt-4">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 text-left hover:bg-white/[0.03]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <MapPinned className="w-4 h-4 text-slate-200" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm sm:text-base font-black text-white">{t('municipiosZonas.titulo')}</span>
            <span className="block truncate text-[11px] sm:text-xs text-slate-400">{t('municipiosZonas.subtitulo')}</span>
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Segmentado
              rotulo={t('municipiosZonas.agruparPor')}
              opcoes={[{ valor: 'municipios', label: t('municipiosZonas.opMunicipios') }, { valor: 'zonas', label: t('municipiosZonas.opZonas') }]}
              valor={tipo}
              onChange={(v) => { setTipo(v); setLimite(PAGINA); }}
              className="w-full sm:w-auto"
            />
            <label className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <span className="sr-only">{t('municipiosZonas.buscarLabel')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setLimite(PAGINA); }}
                placeholder={t('municipiosZonas.buscarPlaceholder')}
                className="h-10 w-full rounded-xl bg-slate-950/60 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {busca && (
                <button type="button" onClick={() => setBusca('')} aria-label={t('municipiosZonas.limparBusca')} className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
            <div className="flex items-center gap-1">
              <label className="sr-only" htmlFor={`ordem-${cargo}-${uf}`}>{t('municipiosZonas.ordenarPor')}</label>
              <select
                id={`ordem-${cargo}-${uf}`}
                value={ordem}
                onChange={(e) => mudarOrdem(e.target.value)}
                className="h-10 flex-1 rounded-xl bg-slate-950/60 px-3 text-sm text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {ORDENS.map((o) => <option key={o.valor} value={o.valor} className="bg-slate-900">{t('municipiosZonas.ordenarOpcao', { label: t(o.chave) })}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/60 text-slate-300 ring-1 ring-white/10 hover:text-white"
                aria-label={direcao === 'asc' ? t('municipiosZonas.ordemCrescente') : t('municipiosZonas.ordemDecrescente')}
              >
                {direcao === 'asc' ? <ArrowUpNarrowWide className="w-4 h-4" /> : <ArrowDownWideNarrow className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="tabular-nums">
              {dados ? `${fmtNum(filtradas.length)} ${tipo === 'zonas' ? t('municipiosZonas.tipoPares') : t('municipiosZonas.tipoMunicipios')}${filtradas.length > visiveis.length ? ` · ${t('municipiosZonas.mostrando', { n: fmtNum(visiveis.length) })}` : ''}` : ''}
            </span>
            <span>{t('municipiosZonas.legendaPre')}<strong className="text-slate-200">{nomeC0}</strong>{t('municipiosZonas.legendaPos', { nome: nomeC0 })}</span>
          </div>

          {erro && (
            <p className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/20">
              <WifiOff className="w-4 h-4 shrink-0" /> {t('municipiosZonas.erro', { erro })}{dados ? t('municipiosZonas.erroUltimo') : ''}
            </p>
          )}
          {carregando && !dados && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('municipiosZonas.carregando')}
            </p>
          )}
          {dados && filtradas.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">{t('municipiosZonas.nadaEncontrado', { busca })}</p>
          )}

          {visiveis.length > 0 && (
            // A tabela depende da largura do próprio bloco (modal, cartão), não da tela: abaixo de 36rem viram cartões
            <div className="@container space-y-3">
              {/* Bloco largo: tabela */}
              <div className="hidden @xl:block overflow-hidden rounded-xl ring-1 ring-white/10">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="w-[30%] px-3 py-2 text-left font-semibold">{tipo === 'zonas' ? t('municipiosZonas.colMunicipioZona') : t('municipiosZonas.colMunicipio')}</th>
                      <th className="w-[12%] px-2 py-2 text-right font-semibold">{t('municipiosZonas.colEleitorado')}</th>
                      <th className="w-[20%] px-2 py-2 text-left font-semibold">{t('municipiosZonas.col1Turno')}</th>
                      <th className="w-[20%] px-2 py-2 text-left font-semibold">{t('municipiosZonas.col2Turno')}</th>
                      <th className="w-[10%] px-2 py-2 text-right font-semibold">{t('municipiosZonas.colDif')}</th>
                      <th className="w-[8%] px-3 py-2 text-right font-semibold">{t('municipiosZonas.colApur')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visiveis.map((l) => (
                      <tr key={l.id} className={l.id === alvo ? 'bg-indigo-500/15' : 'hover:bg-white/[0.02]'}>
                        <td className="px-3 py-2"><NomeLinha l={l} modoZonas={tipo === 'zonas'} /></td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-300">{fmtNum(l.eleitorado)}</td>
                        <td className="px-2 py-2"><MiniBarra pct={l.t1pct} cores={cores} /></td>
                        <td className="px-2 py-2"><MiniBarra pct={l.t2pct} cores={cores} /></td>
                        <td className="px-2 py-2 text-right text-xs"><Dif v={l.difPp} cores={cores} /></td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-300">{fmtPct(l.pctApurado, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bloco estreito (celular, modal): cartões */}
              <ul className="space-y-2 @xl:hidden">
                {visiveis.map((l) => (
                  <li key={l.id} className={`rounded-xl p-3 ring-1 ${l.id === alvo ? 'bg-indigo-500/15 ring-indigo-400/40' : 'bg-slate-950/40 ring-white/10'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1"><NomeLinha l={l} modoZonas={tipo === 'zonas'} /></div>
                      <span className="shrink-0 text-xs"><Dif v={l.difPp} cores={cores} /></span>
                    </div>
                    <div className="mt-2 grid grid-cols-[3.25rem_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-400">
                      <span>{t('municipiosZonas.col1Turno')}</span><MiniBarra pct={l.t1pct} cores={cores} />
                      <span>{t('municipiosZonas.col2Turno')}</span><MiniBarra pct={l.t2pct} cores={cores} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-500">
                      <span>{t('municipiosZonas.eleitores', { n: fmtNum(l.eleitorado) })}</span>
                      <span>{t('municipiosZonas.apurado', { pct: fmtPct(l.pctApurado, 0) })}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {filtradas.length > visiveis.length && (
                <button
                  type="button"
                  onClick={() => setLimite((n) => n + PAGINA)}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                >
                  {t('municipiosZonas.mostrarMais', { n: fmtNum(Math.min(PAGINA, filtradas.length - visiveis.length)), restantes: fmtNum(filtradas.length - visiveis.length) })}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
