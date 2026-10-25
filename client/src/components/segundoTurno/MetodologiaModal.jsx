import React from 'react';
import Modal from './Modal';
import { useI18n } from '../../i18n/useI18n';

function Secao({ titulo, cor = 'text-indigo-300', children }) {
  return (
    <section className="space-y-2.5">
      <h3 className={`text-sm font-black uppercase tracking-wider ${cor}`}>{titulo}</h3>
      <div className="space-y-2.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function Formula({ children }) {
  return (
    <div className="rounded-xl bg-slate-900 ring-1 ring-white/10 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-slate-100 overflow-x-auto">
      {children}
    </div>
  );
}

function Lista({ itens }) {
  return (
    <ul className="space-y-2">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MetodologiaModal({ aberto, onFechar }) {
  const { t } = useI18n();
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={t('metodologia.titulo')} subtitulo={t('metodologia.subtitulo')} largura="max-w-2xl">
      <div className="space-y-7 pb-6">
        <Secao titulo={t('metodologia.unidade.titulo')} cor="text-slate-200">
          <p>
            {t('metodologia.unidade.p1a')}<strong className="text-white">{t('metodologia.unidade.p1b')}</strong>{t('metodologia.unidade.p1c')}
          </p>
          <p>
            {t('metodologia.unidade.p2a')}<strong className="text-white">{t('metodologia.unidade.p2b')}</strong>{t('metodologia.unidade.p2c')}
          </p>
        </Secao>

        <Secao titulo={t('metodologia.faltam.titulo')} cor="text-slate-200">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t('metodologia.faltam.comum')}</p>
          <Formula>
            {t('metodologia.faltam.f1')}<br />
            &nbsp;&nbsp;{t('metodologia.faltam.f2')}<br />
            &nbsp;&nbsp;× {t('metodologia.faltam.f3')}<br />
            &nbsp;&nbsp;× {t('metodologia.faltam.f4')}
          </Formula>
          <p>
            {t('metodologia.faltam.pa')}<strong className="text-white">{t('metodologia.faltam.pb')}</strong>{t('metodologia.faltam.pc')}
          </p>
        </Secao>

        <Secao titulo={t('metodologia.m1.titulo')} cor="text-sky-300">
          <p>
            {t('metodologia.m1.intro')}
          </p>
          <Formula>{t('metodologia.m1.formula')}</Formula>
          <Lista
            itens={[
              t('metodologia.m1.item1'),
              <>
                <strong className="text-white">{t('metodologia.m1.item2a')}</strong>{t('metodologia.m1.item2b')}
              </>,
              <>
                <strong className="text-white">{t('metodologia.m1.item3a')}</strong>{t('metodologia.m1.item3b')}
              </>,
            ]}
          />
        </Secao>

        <Secao titulo={t('metodologia.m2.titulo')} cor="text-emerald-300">
          <Lista
            itens={[
              t('metodologia.m2.item1'),
              <>
                {t('metodologia.m2.item2a')}<strong className="text-white">{t('metodologia.m2.item2b')}</strong>{t('metodologia.m2.item2c')}
              </>,
              t('metodologia.m2.item3'),
            ]}
          />
          <Formula>
            {t('metodologia.m2.f1')}<br />
            &nbsp;&nbsp;{t('metodologia.m2.f2')}<br />
            &nbsp;&nbsp;{t('metodologia.m2.f3')}<br />
            <span className="text-slate-400">{t('metodologia.m2.f4')}</span>
          </Formula>
          <Lista
            itens={[
              t('metodologia.m2.item4'),
              t('metodologia.m2.item5'),
            ]}
          />
        </Secao>

        <Secao titulo={t('metodologia.leitura.titulo')} cor="text-amber-300">
          <p>
            {t('metodologia.leitura.texto')}
          </p>
        </Secao>

        <p className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 text-xs text-slate-400">
          {t('metodologia.fonte')}
        </p>
      </div>
    </Modal>
  );
}
