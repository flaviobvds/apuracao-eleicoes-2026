import React from 'react';
import { BadgeCheck, Calculator, Clock, Hourglass } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import TugRow from './TugRow';
import ApuracaoProgress from './ApuracaoProgress';
import {
  candidatosDe, clarear, coresCorrida, fmtDuracao, fmtHora, fmtNum, fmtParteDeTotal, fmtPct, fmtPp, horaTse,
  isNum, metricaDestaque, nomeUf, parPct,
} from './utils';

export function SeloEleito({ pequeno = false }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-400 text-emerald-950 font-black uppercase tracking-wider ${pequeno ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px] sm:text-[11px]'}`}>
      <BadgeCheck className={pequeno ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {t('raceScoreboard.eleito')}
    </span>
  );
}

function Finalistas({ candidatos, cores, valores, grande }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      {[0, 1].map((i) => {
        const c = candidatos[i];
        const dir = i === 1;
        return (
          <div key={i} className={`min-w-0 flex flex-col ${dir ? 'items-end text-right' : 'items-start text-left'}`}>
            <div className={`flex items-center gap-1.5 flex-wrap ${dir ? 'justify-end' : ''}`}>
              <span
                className="inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-black text-white tabular-nums"
                style={{ background: cores[i] }}
              >
                {c?.numero || '?'}
              </span>
              <span className="text-[11px] font-bold tracking-wide text-slate-400">{c?.partido || ''}</span>
              {c?.eleito && <SeloEleito pequeno={!grande} />}
            </div>
            <div
              className={`mt-1 max-w-full truncate font-bold text-white ${grande ? 'text-base sm:text-2xl' : 'text-sm sm:text-base'}`}
              title={c?.nomeCompleto || c?.nome}
            >
              {c?.nome || t('raceScoreboard.candidato')}
            </div>
            <div
              className={`mt-1 font-black tabular-nums leading-none tracking-tight ${grande ? 'text-4xl sm:text-6xl lg:text-7xl' : 'text-3xl sm:text-4xl'}`}
              style={{ color: isNum(valores[i]) ? clarear(cores[i], 0.15) : '#475569' }}
            >
              {fmtPct(valores[i])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mesmo instante no horário do leste (Toronto), p.ex. " (4:00 PM ET)"; vazio se a data for inválida.
function horaEt(alvo) {
  if (!isNum(alvo)) return '';
  const h = new Date(alvo).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' });
  return ` (${h} ET)`;
}

function ContagemInicio({ inicioApuracao, now, compacto }) {
  const { t } = useI18n();
  const alvo = Date.parse(inicioApuracao || '');
  const falta = isNum(alvo) ? alvo - now : null;
  if (falta != null && falta > 0) {
    return (
      <div className={`rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30 text-center ${compacto ? 'p-3' : 'p-4 sm:p-5'}`}>
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
          <Hourglass className="w-3.5 h-3.5" /> {t('raceScoreboard.comecaEm')}
        </p>
        <p className={`mt-1 font-black tabular-nums text-white leading-none ${compacto ? 'text-3xl' : 'text-4xl sm:text-6xl'}`}>
          {fmtDuracao(falta)}
        </p>
        <p className="mt-2 text-xs text-amber-100/80">
          {t('raceScoreboard.comecaAs', { hora: fmtHora(inicioApuracao, false), et: horaEt(alvo) })}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30 p-3 text-center text-sm font-semibold text-amber-200">
      {t('raceScoreboard.aguardandoBoletins')}
    </div>
  );
}

function Indicadores({ race, tseDataHora, cores, mostrarPre = true }) {
  const { t } = useI18n();
  const ap = race?.apuracao || {};
  const [c0, c1] = candidatosDe(race);
  const pre = parPct(race, 'metrica1PreApuracao');
  const v = race?.variacaoPp;
  const favorecido = isNum(v) ? (v >= 0 ? c0 : c1) : null;
  const itens = [
    [t('raceScoreboard.secoesApuradas'), isNum(ap.secoesTotais) ? t('raceScoreboard.secoesDe', { a: fmtNum(ap.secoesApuradas), b: fmtNum(ap.secoesTotais) }) : '—'],
    [t('raceScoreboard.eleitoradoApurado'), isNum(ap.eleitoradoApurado) ? fmtParteDeTotal(ap.eleitoradoApurado, ap.eleitorado) : '—'],
    [t('raceScoreboard.comparecimento'), isNum(ap.pctComparecimento) ? `${fmtPct(ap.pctComparecimento)}${isNum(ap.comparecimento) && ap.comparecimento > 0 ? ` · ${fmtNum(ap.comparecimento)}` : ''}` : '—'],
    [t('raceScoreboard.atualizacaoTse'), horaTse(tseDataHora) || '—'],
  ];
  return (
    <dl className="grid grid-cols-1 gap-2.5 text-sm">
      {itens.map(([k, val]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
          <dt className="text-slate-400 text-xs">{k}</dt>
          <dd className="font-semibold text-slate-100 tabular-nums text-right">{val}</dd>
        </div>
      ))}
      {mostrarPre && (
        <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
          <dt className="text-slate-400 text-xs">{t('raceScoreboard.projecaoPre')}</dt>
          <dd className="font-semibold tabular-nums text-right">
            <span style={{ color: clarear(cores[0], 0.3) }}>{fmtPct(pre[0])}</span>
            <span className="text-slate-500"> × </span>
            <span style={{ color: clarear(cores[1], 0.3) }}>{fmtPct(pre[1])}</span>
          </dd>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <dt className="text-slate-400 text-xs">{t('raceScoreboard.variacao')}</dt>
        <dd className="font-semibold text-slate-100 text-[13px] leading-snug">
          {favorecido
            ? <>
                <span className="tabular-nums" style={{ color: clarear(cores[v >= 0 ? 0 : 1], 0.3) }}>{v >= 0 ? '+' : '−'}{fmtPp(Math.abs(v), 1)}</span>
                {' '}{t('raceScoreboard.paraCandidato', { nome: favorecido.nome })}
              </>
            : <span className="text-slate-500 font-normal">{t('raceScoreboard.semDadosAinda')}</span>}
        </dd>
      </div>
    </dl>
  );
}

// Placar "cabo de guerra" de uma corrida. variante: 'hero' (Brasil) | 'card' (UF, governador)
export default function RaceScoreboard({
  race, status, inicioApuracao, now, tseDataHora, variante = 'card',
  titulo, onComoCalculamos, acoes = null, children,
}) {
  const { t } = useI18n();
  if (!race) return null;
  const candidatos = candidatosDe(race);
  const cores = coresCorrida(race);
  const hero = variante === 'hero';
  const aguardando = status === 'aguardando' || (!isNum(race.apuracao?.pctSecoes) || race.apuracao.pctSecoes <= 0);
  const destaque = metricaDestaque(race, aguardando ? 'aguardando' : status);
  const encerrada = status === 'encerrada' || race.apuracao?.pctSecoes >= 100;

  const linhas = [
    { key: 'oficial', label: t('raceScoreboard.oficial'), valores: aguardando ? [null, null] : parPct(race, 'oficial'), vazio: t('raceScoreboard.aguardaApuracao'), destaque: encerrada },
    { key: 'metrica1', label: t('raceScoreboard.metrica1'), valores: parPct(race, 'metrica1'), vazio: t('raceScoreboard.semDados') },
    { key: 'metrica2', label: t('raceScoreboard.metrica2'), valores: aguardando ? [null, null] : parPct(race, 'metrica2'), tag: aguardando ? t('raceScoreboard.comecaComApuracao') : null, vazio: t('raceScoreboard.semDados'), destaque: !aguardando && !encerrada },
  ];

  const cargoTxt = race.cargo === 'governador' ? t('raceScoreboard.governador') : t('raceScoreboard.presidente');
  const tituloTxt = titulo || `${cargoTxt} · ${nomeUf(race.uf, race.nome)}`;
  const pct = race.apuracao?.pctSecoes;

  return (
    <section
      className={`relative min-w-0 overflow-hidden border border-white/10 ${hero
        ? 'rounded-3xl bg-[radial-gradient(120%_80%_at_0%_0%,rgba(37,99,235,0.14),transparent_55%),radial-gradient(120%_80%_at_100%_0%,rgba(220,38,38,0.14),transparent_55%)] bg-slate-900/70 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/40'
        : 'rounded-2xl bg-slate-900/70 p-4 sm:p-5'}`}
      aria-label={tituloTxt}
    >
      {/* Faixa de cores no topo */}
      <div className="absolute inset-x-0 top-0 h-1 flex" aria-hidden="true">
        <div className="flex-1" style={{ background: cores[0] }} />
        <div className="flex-1" style={{ background: cores[1] }} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 max-w-full">
          <p className={`font-bold uppercase tracking-[0.18em] text-slate-400 ${hero ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'}`}>
            {hero ? t('raceScoreboard.heroSobretitulo') : cargoTxt}
          </p>
          <h2 className={`truncate font-black tracking-tight text-white ${hero ? 'text-xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>
            {hero ? `${t('raceScoreboard.presidente')} · ${nomeUf(race.uf, race.nome)}` : nomeUf(race.uf, race.nome)}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!hero && isNum(pct) && pct > 0 && (
            <span className="rounded-full bg-white/5 ring-1 ring-white/10 px-2 py-1 text-[11px] font-semibold tabular-nums text-slate-300">
              {t('raceScoreboard.apuradoPct', { pct: fmtPct(pct) })}
            </span>
          )}
          {acoes}
          {onComoCalculamos && (
            <button
              type="button"
              onClick={onComoCalculamos}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-indigo-500/15 px-3 text-xs sm:text-sm font-bold text-indigo-200 ring-1 ring-indigo-400/40 hover:bg-indigo-500/25 hover:text-white transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>{t('raceScoreboard.comoCalculamos')}</span>
            </button>
          )}
        </div>
      </div>

      <div className={hero ? 'mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8' : 'mt-4'}>
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <Finalistas candidatos={candidatos} cores={cores} valores={destaque.valores} grande={hero} />
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] sm:text-xs font-semibold text-slate-300 ring-1 ring-white/10 text-center">
              {destaque.label}
            </span>
          </div>

          {aguardando && status === 'aguardando' && hero && (
            <ContagemInicio inicioApuracao={inicioApuracao} now={now} />
          )}

          <div className="space-y-3.5 sm:space-y-4">
            {linhas.map((l) => (
              <TugRow
                key={l.key}
                label={l.label}
                valores={l.valores}
                cores={cores}
                candidatos={candidatos}
                destaque={l.destaque}
                vazio={l.vazio}
                tag={l.tag}
              />
            ))}
          </div>
        </div>

        {hero ? (
          <aside className="min-w-0 rounded-2xl bg-slate-950/50 ring-1 ring-white/10 p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <ApuracaoProgress pct={pct} />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-400">{t('raceScoreboard.apuracao')}</p>
                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {status === 'encerrada' ? t('raceScoreboard.apuracaoEncerrada') : aguardando ? t('raceScoreboard.aindaNaoComecou') : t('raceScoreboard.emAndamento')}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> TSE: {horaTse(tseDataHora) || '—'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Indicadores race={race} tseDataHora={tseDataHora} cores={cores} />
            </div>
          </aside>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-emerald-400 transition-[width] duration-700" style={{ width: `${isNum(pct) ? Math.min(100, pct) : 0}%` }} />
            </div>
            <Indicadores race={race} tseDataHora={tseDataHora} cores={cores} />
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
