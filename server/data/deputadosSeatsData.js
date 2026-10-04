/**
 * Dados Oficiais de Vagas por UF para Deputados Federais e Estaduais/Distritais
 * Conforme Constituição Federal (Art. 27 e 45) e Lei Complementar 78/1993
 */

// Total de Vagas de Deputados Federais por UF (Total Nacional: 513)
const VAGAS_DEPUTADO_FEDERAL = {
  AC: 8,
  AL: 9,
  AP: 8,
  AM: 8,
  BA: 39,
  CE: 22,
  DF: 8,
  ES: 10,
  GO: 17,
  MA: 18,
  MT: 8,
  MS: 8,
  MG: 53,
  PA: 17,
  PB: 12,
  PR: 30,
  PE: 25,
  PI: 10,
  RJ: 46,
  RN: 8,
  RS: 31,
  RO: 8,
  RR: 8,
  SC: 16,
  SP: 70,
  SE: 8,
  TO: 8
};

/**
 * Calcula o número de Deputados Estaduais/Distritais pela regra constitucional (Art. 27 CF/88):
 * Se federais <= 12: estaduais = 3 * federais
 * Se federais > 12: estaduais = 36 + (federais - 12)
 * Total Nacional: 1.059
 */
function getVagasEstaduais(uf) {
  const fed = VAGAS_DEPUTADO_FEDERAL[uf] || 8;
  if (fed <= 12) {
    return fed * 3;
  }
  return 36 + (fed - 12);
}

// Mapa pré-calculado de vagas estaduais/distritais
const VAGAS_DEPUTADO_ESTADUAL = {};
Object.keys(VAGAS_DEPUTADO_FEDERAL).forEach(uf => {
  VAGAS_DEPUTADO_ESTADUAL[uf] = getVagasEstaduais(uf);
});

// Cores e metadados de partidos e federações
const PARTIDOS_CORES = {
  'PT': '#dc2626',
  'PL': '#2563eb',
  'UNIÃO': '#0284c7',
  'PP': '#0ea5e9',
  'PSD': '#3b82f6',
  'MDB': '#16a34a',
  'REPUBLICANOS': '#1d4ed8',
  'PSDB': '#2563eb',
  'PDT': '#b91c1c',
  'PSB': '#ea580c',
  'PODE': '#6366f1',
  'PSOL': '#eab308',
  'PCdoB': '#991b1b',
  'AVANTE': '#7c3aed',
  'SOLIDARIEDADE': '#f97316',
  'PATRIOTA': '#15803d',
  'PROS': '#f59e0b',
  'NOVO': '#f97316',
  'REDE': '#059669',
  'CIDADANIA': '#e11d48',
  'PV': '#16a34a',
  'PMN': '#9333ea',
  'AGIR': '#4f46e5',
  'DC': '#65a30d',
  'PMB': '#ec4899',
  'PRTB': '#ca8a04',
  'PSTU': '#991b1b',
  'PCB': '#b91c1c',
  'PCO': '#be123c',
  'UP': '#db2777',
  'MISSÃO': '#d97706',
  'DEMOCRATA': '#0891b2'
};

function getPartyColor(sigla) {
  if (!sigla) return '#6b7280';
  const clean = sigla.toUpperCase().trim();
  return PARTIDOS_CORES[clean] || '#6366f1';
}

module.exports = {
  VAGAS_DEPUTADO_FEDERAL,
  VAGAS_DEPUTADO_ESTADUAL,
  getVagasEstaduais,
  getPartyColor
};
