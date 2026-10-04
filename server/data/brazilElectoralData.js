/**
 * Dados Eleitorais do Brasil para Presidente (2026 / Base Oficial TSE)
 * Contagem total de urnas/seções eleitorais com base no histórico oficial TSE.
 */

const REGIONS = {
  NORTE: { id: 'NORTE', name: 'Norte', color: '#10b981' },
  NORDESTE: { id: 'NORDESTE', name: 'Nordeste', color: '#f59e0b' },
  CENTRO_OESTE: { id: 'CENTRO_OESTE', name: 'Centro-Oeste', color: '#8b5cf6' },
  SUDESTE: { id: 'SUDESTE', name: 'Sudeste', color: '#3b82f6' },
  SUL: { id: 'SUL', name: 'Sul', color: '#06b6d4' },
  EXTERIOR: { id: 'EXTERIOR', name: 'Exterior (ZZ)', color: '#ec4899' },
};

const UF_DATA = {
  AC: { uf: 'AC', name: 'Acre', region: 'NORTE', urnasTotal: 2277, capital: 'Rio Branco' },
  AL: { uf: 'AL', name: 'Alagoas', region: 'NORDESTE', urnasTotal: 7291, capital: 'Maceió' },
  AP: { uf: 'AP', name: 'Amapá', region: 'NORTE', urnasTotal: 2073, capital: 'Macapá' },
  AM: { uf: 'AM', name: 'Amazonas', region: 'NORTE', urnasTotal: 8769, capital: 'Manaus' },
  BA: { uf: 'BA', name: 'Bahia', region: 'NORDESTE', urnasTotal: 39203, capital: 'Salvador' },
  CE: { uf: 'CE', name: 'Ceará', region: 'NORDESTE', urnasTotal: 22793, capital: 'Fortaleza' },
  DF: { uf: 'DF', name: 'Distrito Federal', region: 'CENTRO_OESTE', urnasTotal: 7642, capital: 'Brasília' },
  ES: { uf: 'ES', name: 'Espírito Santo', region: 'SUDESTE', urnasTotal: 10565, capital: 'Vitória' },
  GO: { uf: 'GO', name: 'Goiás', region: 'CENTRO_OESTE', urnasTotal: 17169, capital: 'Goiânia' },
  MA: { uf: 'MA', name: 'Maranhão', region: 'NORDESTE', urnasTotal: 18567, capital: 'São Luís' },
  MT: { uf: 'MT', name: 'Mato Grosso', region: 'CENTRO_OESTE', urnasTotal: 8847, capital: 'Cuiabá' },
  MS: { uf: 'MS', name: 'Mato Grosso do Sul', region: 'CENTRO_OESTE', urnasTotal: 7670, capital: 'Campo Grande' },
  MG: { uf: 'MG', name: 'Minas Gerais', region: 'SUDESTE', urnasTotal: 54483, capital: 'Belo Horizonte' },
  PA: { uf: 'PA', name: 'Pará', region: 'NORTE', urnasTotal: 20042, capital: 'Belém' },
  PB: { uf: 'PB', name: 'Paraíba', region: 'NORDESTE', urnasTotal: 10996, capital: 'João Pessoa' },
  PR: { uf: 'PR', name: 'Paraná', region: 'SUL', urnasTotal: 28246, capital: 'Curitiba' },
  PE: { uf: 'PE', name: 'Pernambuco', region: 'NORDESTE', urnasTotal: 23351, capital: 'Recife' },
  PI: { uf: 'PI', name: 'Piauí', region: 'NORDESTE', urnasTotal: 9899, capital: 'Teresina' },
  RJ: { uf: 'RJ', name: 'Rio de Janeiro', region: 'SUDESTE', urnasTotal: 44964, capital: 'Rio de Janeiro' },
  RN: { uf: 'RN', name: 'Rio Grande do Norte', region: 'NORDESTE', urnasTotal: 8740, capital: 'Natal' },
  RS: { uf: 'RS', name: 'Rio Grande do Sul', region: 'SUL', urnasTotal: 30438, capital: 'Porto Alegre' },
  RO: { uf: 'RO', name: 'Rondônia', region: 'NORTE', urnasTotal: 4945, capital: 'Porto Velho' },
  RR: { uf: 'RR', name: 'Roraima', region: 'NORTE', urnasTotal: 1485, capital: 'Boa Vista' },
  SC: { uf: 'SC', name: 'Santa Catarina', region: 'SUL', urnasTotal: 17698, capital: 'Florianópolis' },
  SP: { uf: 'SP', name: 'São Paulo', region: 'SUDESTE', urnasTotal: 115206, capital: 'São Paulo' },
  SE: { uf: 'SE', name: 'Sergipe', region: 'NORDESTE', urnasTotal: 5635, capital: 'Aracaju' },
  TO: { uf: 'TO', name: 'Tocantins', region: 'NORTE', urnasTotal: 4668, capital: 'Palmas' },
  ZZ: { uf: 'ZZ', name: 'Exterior', region: 'EXTERIOR', urnasTotal: 1009, capital: 'Exterior' }
};

// Candidatos oficiais à Presidência da República 2026
const DEFAULT_CANDIDATES_2026 = [
  { id: '13', number: '13', name: 'Lula', party: 'PT', color: '#dc2626', badgeColor: 'bg-red-600' },
  { id: '22', number: '22', name: 'Flávio Bolsonaro', party: 'PL', color: '#2563eb', badgeColor: 'bg-blue-600' },
  { id: '55', number: '55', name: 'Ronaldo Caiado', party: 'PSD', color: '#0284c7', badgeColor: 'bg-sky-600' },
  { id: '30', number: '30', name: 'Romeu Zema', party: 'NOVO', color: '#ea580c', badgeColor: 'bg-orange-600' },
  { id: '14', number: '14', name: 'Renan Santos', party: 'MISSÃO', color: '#d97706', badgeColor: 'bg-amber-600' },
  { id: '70', number: '70', name: 'Augusto Cury', party: 'AVANTE', color: '#7c3aed', badgeColor: 'bg-purple-600' },
  { id: '99', number: '99', name: 'Outros Candidatos', party: 'OUTROS', color: '#6b7280', badgeColor: 'bg-gray-500' }
];

// Preset para simulação de 2º Turno
const CANDIDATES_2ND_ROUND_2026 = [
  { id: '13', number: '13', name: 'Lula', party: 'PT', color: '#dc2626', badgeColor: 'bg-red-600' },
  { id: '22', number: '22', number: '22', name: 'Flávio Bolsonaro', party: 'PL', color: '#2563eb', badgeColor: 'bg-blue-600' }
];

// Média estimada de votos válidos por urna por estado
const AVG_VALID_VOTES_PER_URNA = 220;

module.exports = {
  REGIONS,
  UF_DATA,
  DEFAULT_CANDIDATES_2026,
  CANDIDATES_2ND_ROUND_2026,
  AVG_VALID_VOTES_PER_URNA
};
