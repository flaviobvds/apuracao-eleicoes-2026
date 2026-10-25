// Dicionários pt e en com as MESMAS chaves, montados a partir dos módulos de mensagens (um por área da página).
import comum from './mensagens/comum';
import placar from './mensagens/placar';
import grafico from './mensagens/grafico';
import municipios from './mensagens/municipios';

const MODULOS = [comum, placar, grafico, municipios];

export const DICIONARIOS = {
  pt: Object.assign({}, ...MODULOS.map((m) => m.pt)),
  en: Object.assign({}, ...MODULOS.map((m) => m.en)),
};
