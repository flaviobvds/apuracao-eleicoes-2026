// Idioma atual em nível de módulo. O I18nProvider o define de forma síncrona antes de renderizar os filhos,
// para que código fora do React (formatadores de utils.js, mensagens de erro dos hooks) use o idioma certo
// sem mudar as chamadas existentes.
import { DICIONARIOS } from './dicionarios';

export const IDIOMAS = ['pt', 'en'];
const LOCALES = { pt: 'pt-BR', en: 'en-US' };
const HTML_LANG = { pt: 'pt-BR', en: 'en' };

let idiomaAtual = 'pt';

export function normalizarIdioma(v) {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('pt')) return 'pt';
  if (s.startsWith('en')) return 'en';
  return null;
}

export function definirIdiomaAtual(lang) {
  idiomaAtual = lang === 'en' ? 'en' : 'pt';
}

export function idiomaDoModulo() {
  return idiomaAtual;
}

export function localeDe(lang) {
  return LOCALES[lang] || LOCALES.pt;
}

export function htmlLangDe(lang) {
  return HTML_LANG[lang] || HTML_LANG.pt;
}

// Locale do idioma atual ("pt-BR" ou "en-US"), para toLocaleString.
export function localeAtual() {
  return localeDe(idiomaAtual);
}

// t(chave, vars) com interpolação {nome}. Chave ausente: cai no português e, por fim, na própria chave.
export function traduzir(lang, chave, vars) {
  const dic = DICIONARIOS[lang] || DICIONARIOS.pt;
  let texto = dic[chave];
  if (texto == null) texto = DICIONARIOS.pt[chave];
  if (texto == null) return chave;
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (m, nome) => (vars[nome] != null ? String(vars[nome]) : m));
}

// Tradução fora de componentes (usa o idioma do módulo). Em componentes, prefira useI18n().t.
export function tr(chave, vars) {
  return traduzir(idiomaAtual, chave, vars);
}
