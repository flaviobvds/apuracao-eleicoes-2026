import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

const OPCOES = [
  { lang: 'pt', rotulo: 'PT', htmlLang: 'pt-BR' },
  { lang: 'en', rotulo: 'EN', htmlLang: 'en' },
];

// Seletor compacto "PT | EN" para o cabeçalho (alvos de toque de 36 px).
export default function SeletorIdioma({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('idioma.aria')}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-700/80 bg-slate-800/90 p-0.5 ${className}`}
    >
      <Globe className="mx-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {OPCOES.map((o) => {
        const ativo = lang === o.lang;
        return (
          <button
            key={o.lang}
            type="button"
            onClick={() => setLang(o.lang)}
            aria-pressed={ativo}
            lang={o.htmlLang}
            title={t(`idioma.nome.${o.lang}`)}
            className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-bold tracking-wide transition-colors ${
              ativo ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
