import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';

// Pilha de modais abertos: Esc fecha só o de cima.
const pilha = [];
let seq = 0;

// Modal acessível: tela cheia no celular; painel lateral (lado="direita") ou centralizado no desktop.
export default function Modal({ aberto, onFechar, titulo, subtitulo, lado = 'centro', largura = 'max-w-3xl', children }) {
  const { t } = useI18n();
  const painelRef = useRef(null);
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    if (!aberto) return undefined;
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const meuId = ++seq;
    pilha.push(meuId);
    const onKey = (e) => {
      if (e.key === 'Escape' && pilha[pilha.length - 1] === meuId) {
        e.stopPropagation();
        fecharRef.current?.();
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => painelRef.current?.focus(), 30);
    return () => {
      clearTimeout(t);
      const i = pilha.indexOf(meuId);
      if (i >= 0) pilha.splice(i, 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
      if (anterior && typeof anterior.focus === 'function') anterior.focus();
    };
  }, [aberto]);

  if (!aberto) return null;

  const posicao = lado === 'direita'
    ? 'sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-xl sm:border-l'
    : `sm:inset-x-0 sm:mx-auto sm:top-6 sm:bottom-6 sm:w-[calc(100%-2rem)] ${largura} sm:rounded-2xl sm:border`;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onFechar} aria-hidden="true" />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`absolute inset-0 flex flex-col bg-slate-950 border-white/10 shadow-2xl outline-none ${posicao}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base sm:text-lg font-black text-white">{titulo}</h2>
            {subtitulo && <p className="truncate text-xs text-slate-400">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
            aria-label={t('modal.fechar')}
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
