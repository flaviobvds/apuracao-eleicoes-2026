import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nContext } from './contexto';
import { definirIdiomaAtual, htmlLangDe, localeDe, normalizarIdioma, traduzir } from './estado';

const CHAVE_STORAGE = 'idioma';

function salvarIdioma(lang) {
  try {
    window.localStorage.setItem(CHAVE_STORAGE, lang);
  } catch {
    // armazenamento indisponível (modo privado etc.): segue só em memória
  }
}

// Ordem: ?lang= na URL (vira a escolha salva) → escolha salva → idioma do navegador (pt* → pt, outro → en).
function idiomaInicial() {
  if (typeof window === 'undefined') return 'pt';
  try {
    const daUrl = normalizarIdioma(new URLSearchParams(window.location.search).get('lang'));
    if (daUrl) {
      salvarIdioma(daUrl);
      return daUrl;
    }
  } catch {
    // URL ilegível: ignora
  }
  try {
    const salvo = normalizarIdioma(window.localStorage.getItem(CHAVE_STORAGE));
    if (salvo) return salvo;
  } catch {
    // armazenamento indisponível
  }
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const preferidos = nav?.languages?.length ? nav.languages : [nav?.language];
  const primeiro = String(preferidos[0] || '').toLowerCase();
  if (!primeiro) return 'pt';
  return primeiro.startsWith('pt') ? 'pt' : 'en';
}

export default function I18nProvider({ initialLang, children }) {
  const [lang, setLangState] = useState(() => normalizarIdioma(initialLang) || idiomaInicial());

  // Síncrono, antes dos filhos: os formatadores de utils.js leem o locale daqui.
  definirIdiomaAtual(lang);

  const setLang = useCallback((novo) => {
    const l = normalizarIdioma(novo);
    if (!l) return;
    setLangState(l);
    salvarIdioma(l);
    // se a URL trouxer ?lang=, acompanha a escolha (senão um recarregamento voltaria ao idioma antigo)
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', l);
        window.history.replaceState(window.history.state, '', url);
      }
    } catch {
      // sem histórico: ignora
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = htmlLangDe(lang);
  }, [lang]);

  const valor = useMemo(() => ({
    lang,
    setLang,
    locale: localeDe(lang),
    t: (chave, vars) => traduzir(lang, chave, vars),
  }), [lang, setLang]);

  return <I18nContext.Provider value={valor}>{children}</I18nContext.Provider>;
}
