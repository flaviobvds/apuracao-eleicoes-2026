import { useContext } from 'react';
import { I18nContext } from './contexto';
import { idiomaDoModulo, localeDe, traduzir } from './estado';

// { lang, setLang, t, locale }. Sem provider (testes isolados), usa o idioma do módulo.
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  const lang = idiomaDoModulo();
  return { lang, setLang: () => {}, t: (chave, vars) => traduzir(lang, chave, vars), locale: localeDe(lang) };
}
