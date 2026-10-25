import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { fmtHora, horaTse } from './utils';

const STATUS = {
  apurando: { txt: 'Ao vivo · apurando', cls: 'bg-red-500/15 text-red-200 ring-red-400/40', ponto: 'bg-red-400 animate-ping' },
  aguardando: { txt: 'Aguardando apuração', cls: 'bg-amber-400/10 text-amber-200 ring-amber-400/30', ponto: 'bg-amber-300' },
  encerrada: { txt: 'Apuração encerrada', cls: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/30', ponto: 'bg-emerald-300' },
};

export function StatusPill({ status }) {
  const s = STATUS[status] || { txt: 'Conectando…', cls: 'bg-white/5 text-slate-300 ring-white/10', ponto: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider ring-1 ${s.cls}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${s.ponto}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.ponto.split(' ')[0]}`} />
      </span>
      {s.txt}
    </span>
  );
}

// Barra de status: estado da apuração, horários, contagem regressiva e "Atualizar agora".
export default function StatusBar({ data, erro, contagem, atualizando, onAtualizar }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <StatusPill status={data?.status} />
          <span className="text-xs text-slate-400 tabular-nums">
            Atualizado às <strong className="text-slate-200">{fmtHora(data?.atualizadoEm)}</strong>
            {horaTse(data?.tseDataHora) && <> · TSE <strong className="text-slate-200">{horaTse(data.tseDataHora)}</strong></>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 tabular-nums" aria-live="off">
            Próxima em <strong className="inline-block w-7 text-right text-slate-200">{contagem}s</strong>
          </span>
          <button
            type="button"
            onClick={onAtualizar}
            disabled={atualizando}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
            Atualizar agora
          </button>
        </div>
      </div>
      {erro && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/20" role="status">
          <WifiOff className="mt-px w-4 h-4 shrink-0" />
          <span>
            Falha ao atualizar ({erro}).{' '}
            {data ? `Mostrando os dados de ${fmtHora(data.atualizadoEm)}; nova tentativa em ${contagem}s.` : `Nova tentativa em ${contagem}s.`}
          </span>
        </p>
      )}
    </div>
  );
}
