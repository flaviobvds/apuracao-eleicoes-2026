/**
 * Serviço de Apuração de Deputados Federais e Estaduais (TSE 2026)
 * Conecta aos endpoints c0006 (Federal), c0007 (Estadual) e c0008 (Distrital) da eleição 6259
 */

const { VAGAS_DEPUTADO_FEDERAL, VAGAS_DEPUTADO_ESTADUAL } = require('../data/deputadosSeatsData');
const { calculateProportionalDistribution } = require('./proportionalCalculator');

const TSE_CONFIG = {
  ano: '2026',
  eleicaoDeputados: '6259',
  cargoFederal: 'c0006',
  cargoEstadual: 'c0007',
  cargoDistrital: 'c0008',
  baseUrl: 'https://resultados.tse.jus.br/oficial'
};

// Cache em memória de 5 segundos por UF e Cargo
const cache = new Map();

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TSE-Apuracao-2026/1.0',
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca dados oficiais e calcula as bancadas eleitas por partido
 * @param {string} uf Sigla do estado (ex: 'SP', 'MG', 'DF')
 * @param {'federal'|'estadual'} cargo Tipo de cargo
 */
async function fetchDeputadosUf(uf = 'SP', cargo = 'federal') {
  const ufUpper = uf.toUpperCase();
  const ufLower = uf.toLowerCase();
  const cacheKey = `${ufUpper}_${cargo}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp < 5000)) {
    return cached.data;
  }

  // Definir código do cargo no TSE
  let cargoCode = TSE_CONFIG.cargoFederal;
  let totalVagas = VAGAS_DEPUTADO_FEDERAL[ufUpper] || 8;

  if (cargo === 'estadual') {
    cargoCode = (ufUpper === 'DF') ? TSE_CONFIG.cargoDistrital : TSE_CONFIG.cargoEstadual;
    totalVagas = VAGAS_DEPUTADO_ESTADUAL[ufUpper] || 24;
  }

  const url = `${TSE_CONFIG.baseUrl}/ele${TSE_CONFIG.ano}/${TSE_CONFIG.eleicaoDeputados}/dados/${ufLower}/${ufLower}-${cargoCode}-e00${TSE_CONFIG.eleicaoDeputados}-u.json`;

  const tseData = await fetchJson(url);

  // Extrair informações de urnas
  const s = tseData.s || {};
  const urnasTotal = parseInt(s.ts || '0', 10);
  const urnasApuradas = parseInt(s.st || '0', 10);
  const urnasRestantes = Math.max(0, urnasTotal - urnasApuradas);
  const percentualApurado = parseFloat((s.pst || '0').replace(',', '.'));

  // Extrair informações de votos válidos
  const v = tseData.v || {};
  const totalVotosValidos = parseInt(v.vvc || v.vv || '0', 10);
  const totalVotosBrancos = parseInt(v.vb || '0', 10);
  const totalVotosNulos = parseInt(v.vn || '0', 10);
  const totalGeralVotos = parseInt(v.tv || '0', 10);

  // Extrair agremiações (Partidos Isolados ou Federações)
  const carg = (tseData.carg && tseData.carg[0]) || {};
  const rawPartidos = [];

  (carg.agr || []).forEach(agr => {
    const isFederacao = agr.tp === 'f';
    const partiesList = agr.par || [];

    // Sigla representativa
    let sigla = '';
    let nome = agr.nm || '';
    let numeroPrincipal = '';

    if (isFederacao && partiesList.length > 1) {
      sigla = partiesList.map(p => p.sg).join('/');
      numeroPrincipal = partiesList[0].n;
    } else if (partiesList.length > 0) {
      sigla = partiesList[0].sg || agr.nm;
      nome = partiesList[0].nm || agr.nm;
      numeroPrincipal = partiesList[0].n;
    } else {
      sigla = agr.nm;
    }

    let votosNominaisTotais = 0;
    let votosLegendaTotais = 0;
    let votosTotais = 0;
    const todosCandidatos = [];

    partiesList.forEach(par => {
      const parSigla = par.sg || sigla;
      const tvtn = parseInt(par.tvtn || '0', 10);
      const tvtl = parseInt(par.tvtl || '0', 10);

      const candSum = (par.cand || []).reduce((acc, c) => acc + parseInt(c.vap || '0', 10), 0);
      const nominaisPar = tvtn > 0 ? tvtn : candSum;
      const legendaPar = tvtl;
      const totalPar = nominaisPar + legendaPar;

      votosNominaisTotais += nominaisPar;
      votosLegendaTotais += legendaPar;
      votosTotais += totalPar;

      (par.cand || []).forEach(c => {
        const vap = parseInt(c.vap || '0', 10);
        todosCandidatos.push({
          id: c.n,
          numero: c.n,
          nome: c.nm,
          nomeUrna: c.nmu || c.nm,
          partidoOrigem: parSigla,
          siglaGrupo: sigla,
          votosNominais: vap,
          percentualValidos: totalVotosValidos > 0 
            ? Number(((vap / totalVotosValidos) * 100).toFixed(2)) 
            : 0
        });
      });
    });

    // Se o somatório de votos for 0, somar dos candidatos
    if (votosNominaisTotais === 0) {
      votosNominaisTotais = todosCandidatos.reduce((acc, c) => acc + c.votosNominais, 0);
      votosTotais = votosNominaisTotais + votosLegendaTotais;
    }

    rawPartidos.push({
      sigla,
      nome,
      numero: numeroPrincipal,
      isFederacao,
      votosNominais: votosNominaisTotais,
      votosLegenda: votosLegendaTotais,
      votosTotais,
      candidatos: todosCandidatos
    });
  });

  // Executar o motor proporcional
  const resultadoProporcional = calculateProportionalDistribution({
    uf: ufUpper,
    cargo,
    totalVagas,
    rawPartidos,
    totalVotosValidos,
    urnasInfo: {
      urnasTotal,
      urnasApuradas,
      urnasRestantes,
      percentualApurado,
      totalVotosBrancos,
      totalVotosNulos,
      totalGeralVotos
    }
  });

  const responsePayload = {
    success: true,
    uf: ufUpper,
    cargo,
    cargoNome: cargo === 'federal' ? 'Deputado Federal' : (ufUpper === 'DF' ? 'Deputado Distrital' : 'Deputado Estadual'),
    casaLegislativa: cargo === 'federal' ? 'Câmara dos Deputados' : (ufUpper === 'DF' ? 'Câmara Legislativa (CLDF)' : 'Assembleia Legislativa'),
    lastUpdated: new Date().toISOString(),
    ...resultadoProporcional
  };

  cache.set(cacheKey, { timestamp: now, data: responsePayload });
  return responsePayload;
}

module.exports = {
  fetchDeputadosUf
};
