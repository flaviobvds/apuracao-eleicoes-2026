import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Modal from './segundoTurno/Modal';
import { useI18n } from '../i18n/useI18n';

// Marcas do GitHub e do LinkedIn (o lucide-react não traz ícones de marca)
const ICONE_GITHUB = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const ICONE_LINKEDIN = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const LINKS = [
  { rotulo: 'GitHub', detalhe: 'github.com/flaviobvds', url: 'https://github.com/flaviobvds/', icone: ICONE_GITHUB },
  { rotulo: 'LinkedIn', detalhe: 'linkedin.com/in/flaviobvdsilva', url: 'https://www.linkedin.com/in/flaviobvdsilva/', icone: ICONE_LINKEDIN },
];

// Link "Sobre o desenvolvedor" para o rodapé, com o modal de apresentação.
export default function SobreDesenvolvedor({ className = '' }) {
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`inline-flex min-h-8 items-center font-semibold text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white hover:decoration-slate-300 ${className}`}
      >
        {t('sobre.titulo')}
      </button>
      <Modal aberto={aberto} onFechar={() => setAberto(false)} titulo={t('sobre.titulo')} largura="max-w-md">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-lg font-black text-white">
              FS
            </div>
            <div>
              <p className="text-base font-black text-white">Flavio Silva</p>
              <p className="text-xs text-slate-400">{t('sobre.papel')}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {t('sobre.texto')}
          </p>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.rotulo}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-slate-100" aria-hidden="true"><path d={l.icone} /></svg>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">{l.rotulo}</span>
                    <span className="block truncate text-xs text-slate-400">{l.detalhe}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
