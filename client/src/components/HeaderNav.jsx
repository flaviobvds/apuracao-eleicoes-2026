import React from 'react';
import { RefreshCw, Layers, MapPin, Vote, Users } from 'lucide-react';
import SeletorIdioma from './SeletorIdioma';
import { useI18n } from '../i18n/useI18n';

export default function HeaderNav({
  activePage = 'presidente',
  onChangePage,
  segundoTurnoStatus = null,
  viewMode,
  onChangeViewMode,
  onManualRefresh,
  isRefreshing,
  lastUpdated
}) {
  const { t } = useI18n();
  const formattedTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
          {/* Logo e Título, com o seletor de idioma à direita na mesma linha (no desktop das páginas antigas ele vai para os controles da direita) */}
          <div className={`flex w-full items-center justify-between gap-2 ${activePage === 'segundo-turno' ? '' : 'lg:w-auto'}`}>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h1 className="text-base min-[400px]:text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                  {t('header.titulo')}
                </h1>
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {t('header.aoVivo')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('header.subtitulo')}
              </p>
            </div>
          </div>
          <div className={`shrink-0 ${activePage === 'segundo-turno' ? '' : 'lg:hidden'}`}>
            <SeletorIdioma />
          </div>
          </div>

          {/* Abas Principais de Navegação: Segundo Turno, Presidente (1º turno) e Deputados.
              Na página do 2º turno (inicial) ficam ocultas; as do 1º turno seguem nas suas URLs. */}
          {activePage !== 'segundo-turno' && (
          <div className="flex w-full max-w-full items-center gap-0.5 overflow-x-auto bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner lg:w-auto">
            <button
              onClick={() => onChangePage && onChangePage('segundo-turno')}
              aria-current={activePage === 'segundo-turno' ? 'page' : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activePage === 'segundo-turno'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white bg-gradient-to-r from-blue-600/30 to-red-600/30 ring-1 ring-white/15 hover:from-blue-600/50 hover:to-red-600/50'
              }`}
            >
              {t('header.abaSegundoTurno')}
              {segundoTurnoStatus === 'apurando' ? (
                <span className="flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t('header.aoVivo')}
                </span>
              ) : (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activePage === 'segundo-turno' ? 'bg-slate-950 text-white' : 'bg-amber-400 text-amber-950'}`}>
                  {t('header.seloSegundoTurno')}
                </span>
              )}
            </button>
            <button
              onClick={() => onChangePage && onChangePage('presidente')}
              className={`flex min-h-10 shrink-0 items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'presidente'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Vote className="w-4 h-4 hidden sm:block" />
              <span className="sm:hidden">{t('header.abaPrimeiroTurnoCurta')}</span>
              <span className="hidden sm:inline">{t('header.abaPrimeiroTurno')}</span>
            </button>
            <button
              onClick={() => onChangePage && onChangePage('deputados')}
              className={`flex min-h-10 shrink-0 items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'deputados'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4 hidden sm:block" />
              <span className="sm:hidden">{t('header.abaDeputadosCurta')}</span>
              <span className="hidden sm:inline">{t('header.abaDeputados')}</span>
            </button>
          </div>
          )}

          {/* Controles da Direita */}
          {activePage !== 'segundo-turno' && (
          <div className="flex items-center gap-3">
            {/* Se estiver na página de Presidente, exibe o toggle Região / Estado */}
            {activePage === 'presidente' && (
              <div className="hidden sm:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
                <button
                  onClick={() => onChangeViewMode('regiao')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'regiao'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('header.regiao')}
                </button>
                <button
                  onClick={() => onChangeViewMode('estado')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'estado'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('header.estado')}
                </button>
              </div>
            )}

            {/* Botão Manual de Atualizar */}
            {activePage === 'presidente' && (
              <button
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                title={t('header.atualizar')}
                aria-label={t('header.atualizar')}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}

            {/* Seletor de idioma no desktop das páginas antigas (no celular ele fica ao lado do logo) */}
            <div className="hidden lg:block">
              <SeletorIdioma />
            </div>
          </div>
          )}
        </div>
      </div>
    </header>
  );
}
