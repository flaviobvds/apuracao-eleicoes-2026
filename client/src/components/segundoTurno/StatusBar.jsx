import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { fmtHora, horaTse } from './utils';
import { useI18n } from '../../i18n/useI18n';

// curto: rótulo no celular; longo: a partir de sm (textos em status.<chave>.curto/.longo)
const STATUS = {
  apurando: { cls: 'bg-red-500/15 text-red-200 ring-red-400/40', ponto: 'bg-red-400 animate-ping' },
  aguardando: { cls: 'bg-amber-400/10 text-amber-200 ring-amber-400/30', ponto: 'bg-amber-300' },
  encerrada: { cls: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/30', ponto: 'bg-emerald-300' },
};

export function StatusPill({ status }) {
  const { t } = useI18n();
  const conhecido = STATUS[status];
  const s = conhecido
    ? { ...conhecido, curto: t(`status.${status}.curto`), longo: t(`status.${status}.longo`) }
    : { curto: t('status.conectando'), longo: t('status.conectando'), cls: 'bg-white/5 text-slate-300 ring-white/10', ponto: 'bg-slate-400' };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ring-1 ${s.cls}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${s.ponto}`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.ponto.split(' ')[0]}`} />
      </span>
      <span className="sm:hidden">{s.curto}</span>
      <span className="hidden sm:inline">{s.longo}</span>
    </span>
  );
}

// Barra de status compacta: estado da apuração, horários e botão de atualizar com a contagem regressiva.
export default function StatusBar({ data, erro, contagem, atualizando, onAtualizar }) {
  const { t } = useI18n();
  const tse = horaTse(data?.tseDataHora);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/50 px-2.5 py-1.5 sm:px-3">
        <StatusPill status={data?.status} />
        <span className="min-w-0 flex-1 truncate text-[11px] sm:text-xs text-slate-400 tabular-nums">
          <span className="hidden sm:inline">{t('status.atualizado')}</span>{t('status.as')}<strong className="font-semibold text-slate-200">{fmtHora(data?.atualizadoEm)}</strong>
          {tse && <span className="hidden sm:inline"> · TSE <strong className="font-semibold text-slate-200">{tse}</strong></span>}
        </span>
        <button
          type="button"
          onClick={onAtualizar}
          disabled={atualizando}
          title={t('status.atualizarAgora')}
          aria-label={t('status.atualizarAria', { s: contagem })}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-xs font-semibold text-slate-100 ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? 'animate-spin' : ''}`} />
          <span className="tabular-nums w-6 text-right" aria-hidden="true">{contagem}s</span>
        </button>
      </div>
      {erro && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/20" role="status">
          <WifiOff className="mt-px w-4 h-4 shrink-0" />
          <span>
            {t('status.falha', { erro })}{' '}
            {data ? t('status.mostrandoDados', { hora: fmtHora(data.atualizadoEm), s: contagem }) : t('status.novaTentativa', { s: contagem })}
          </span>
        </p>
      )}
    </div>
  );
}
