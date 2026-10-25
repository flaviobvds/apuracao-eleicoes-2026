import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import { fmtDec, isNum } from './utils';

// Faixa bem visível para modo simulação (?simular=NN) e mock local (?mock=1).
export default function SimulacaoBanner({ modo, simulacao }) {
  const { t } = useI18n();
  const simulando = modo?.simular != null || simulacao;
  if (!simulando && !modo?.mock) return null;
  const alvo = isNum(simulacao?.pctAlvo) ? simulacao.pctAlvo : Number(modo?.simular);
  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-400 px-4 py-3 text-amber-950 shadow-lg shadow-amber-500/20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.07)_0_14px,transparent_14px_28px)]" aria-hidden="true" />
      <div className="relative flex items-start gap-3">
        <FlaskConical className="mt-0.5 w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-black uppercase tracking-wider">
            {simulando ? t('simulacaoBanner.modoSimulacao') : t('simulacaoBanner.modoMock')}
          </p>
          <p className="text-xs sm:text-sm font-medium">
            {simulando
              ? t('simulacaoBanner.dadosSimulados', { secoes: Number.isFinite(alvo) ? t('simulacaoBanner.comSecoes', { pct: fmtDec(alvo, 0) }) : '' })
              : t('simulacaoBanner.mock')}
          </p>
        </div>
      </div>
    </div>
  );
}
