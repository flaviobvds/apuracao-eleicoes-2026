/**
 * Serviço de Integração com a API Oficial do TSE
 * Monitora eleições presidenciais através dos endpoints públicos do TSE
 */

const { UF_DATA } = require('../data/brazilElectoralData');

// Códigos Oficiais TSE 2026 (conforme ele-c.json)
const TSE_CONFIG_2026 = {
  ano: '2026',
  pleito: '3220',
  eleicao1Turno: '6257',
  eleicao2Turno: '6258',
  cargoPresidente: 'c0001',
  baseUrl: 'https://resultados.tse.jus.br/oficial'
};

// Metadados visuais para os candidatos presidenciais oficiais
const CANDIDATE_METADATA = {
  '22': { shortName: 'Flávio Bolsonaro', party: 'PL', color: '#2563eb', badgeColor: 'bg-blue-600' },
  '13': { shortName: 'Lula', party: 'PT', color: '#dc2626', badgeColor: 'bg-red-600' },
  '70': { shortName: 'Escritor Augusto Cury', party: 'AVANTE', color: '#7c3aed', badgeColor: 'bg-purple-600' },
  '14': { shortName: 'Renan Santos', party: 'MISSÃO', color: '#d97706', badgeColor: 'bg-amber-600' },
  '55': { shortName: 'Ronaldo Caiado', party: 'PSD', color: '#0284c7', badgeColor: 'bg-sky-600' },
  '30': { shortName: 'Romeu Zema', party: 'NOVO', color: '#ea580c', badgeColor: 'bg-orange-600' },
  '80': { shortName: 'Samara Martins', party: 'UP', color: '#db2777', badgeColor: 'bg-pink-600' },
  '16': { shortName: 'Hertz Dias', party: 'PSTU', color: '#991b1b', badgeColor: 'bg-red-800' },
  '27': { shortName: 'Clariana Barão', party: 'DC', color: '#65a30d', badgeColor: 'bg-lime-600' },
  '21': { shortName: 'Edmilson Costa', party: 'PCB', color: '#b91c1c', badgeColor: 'bg-red-700' },
  '35': { shortName: 'Wilson Grassi', party: 'DEMOCRATA', color: '#0891b2', badgeColor: 'bg-cyan-600' },
  '29': { shortName: 'Rui Costa Pimenta', party: 'PCO', color: '#be123c', badgeColor: 'bg-rose-700' }
};

// Cache em memória de 4 segundos
let tseCache = {
  timestamp: 0,
  data: null
};

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
 * Consulta a disponibilidade dos dados da eleição 2026 no TSE
 */
async function checkTseLiveStatus(eleicaoCode = TSE_CONFIG_2026.eleicao1Turno) {
  const brUrl = `${TSE_CONFIG_2026.baseUrl}/ele${TSE_CONFIG_2026.ano}/${eleicaoCode}/dados/br/br-${TSE_CONFIG_2026.cargoPresidente}-e00${eleicaoCode}-u.json`;
  try {
    const data = await fetchJson(brUrl);
    return {
      available: true,
      url: brUrl,
      dg: data.dg,
      hg: data.hg,
      st: parseInt(data.s?.st || '0', 10),
      ts: parseInt(data.s?.ts || '0', 10),
      pst: data.s?.pst || '0,00'
    };
  } catch (err) {
    return {
      available: false,
      url: brUrl,
      error: err.message,
      message: 'Dados oficiais do TSE ainda não liberados ou servidores indisponíveis.'
    };
  }
}

/**
 * Busca o snapshot oficial do TSE (BR) e os 28 estados/UF para projeção
 */
async function fetchAllStatesFromTse(eleicaoCode = TSE_CONFIG_2026.eleicao1Turno) {
  const now = Date.now();
  if (tseCache.data && (now - tseCache.timestamp < 4000)) {
    return tseCache.data;
  }

  // 1. Obter arquivo oficial consolidado BR
  const brUrl = `${TSE_CONFIG_2026.baseUrl}/ele${TSE_CONFIG_2026.ano}/${eleicaoCode}/dados/br/br-${TSE_CONFIG_2026.cargoPresidente}-e00${eleicaoCode}-u.json`;
  let brData = null;
  try {
    brData = await fetchJson(brUrl);
  } catch (err) {
    return { success: false, status: { available: false, error: err.message }, states: [] };
  }

  const sBr = brData.s || {};
  const vBr = brData.v || {};
  const urnasTotalBr = parseInt(sBr.ts || '0', 10);
  const urnasApuradasBr = parseInt(sBr.st || '0', 10);
  const urnasRestantesBr = Math.max(0, urnasTotalBr - urnasApuradasBr);
  const percentualApuradoBr = parseFloat((sBr.pst || '0').replace(',', '.'));
  const totalVotosValidosBr = parseInt(vBr.vvc || '0', 10);
  const totalVotosBrancosBr = parseInt(vBr.vb || '0', 10);
  const totalVotosNulosBr = parseInt(vBr.vn || '0', 10);
  const totalGeralVotosBr = parseInt(vBr.tv || '0', 10);

  const candMetaMap = {};
  const nacionalCandidatos = [];

  (brData.carg && brData.carg[0] && brData.carg[0].agr || []).forEach(agr => {
    (agr.par || []).forEach(par => {
      (par.cand || []).forEach(c => {
        const num = c.n;
        const meta = CANDIDATE_METADATA[num];
        const name = meta?.shortName || c.nm;
        const party = meta?.party || par.sg || agr.nm || '';
        const color = meta?.color || '#6b7280';
        const badgeColor = meta?.badgeColor || 'bg-gray-600';
        const vap = parseInt(c.vap || '0', 10);
        const pvap = parseFloat((c.pvap || '0').replace(',', '.'));

        const candObj = {
          id: num,
          number: num,
          name,
          party,
          color,
          badgeColor,
          votosApurados: vap,
          percentualAtual: pvap
        };
        candMetaMap[num] = candObj;
        nacionalCandidatos.push(candObj);
      });
    });
  });

  // Ordenar candidatos nacionais por votos apurados
  nacionalCandidatos.sort((a, b) => b.votosApurados - a.votosApurados);

  const nacionalSnapshot = {
    urnasTotal: urnasTotalBr,
    urnasApuradas: urnasApuradasBr,
    urnasRestantes: urnasRestantesBr,
    percentualApurado: Number(percentualApuradoBr.toFixed(2)),
    totalVotosValidosApurados: totalVotosValidosBr,
    totalVotosBrancos: totalVotosBrancosBr,
    totalVotosNulos: totalVotosNulosBr,
    totalGeralVotos: totalGeralVotosBr,
    percentualValidos: totalGeralVotosBr > 0 ? Number(((totalVotosValidosBr / totalGeralVotosBr) * 100).toFixed(2)) : 100,
    percentualBrancos: totalGeralVotosBr > 0 ? Number(((totalVotosBrancosBr / totalGeralVotosBr) * 100).toFixed(2)) : 0,
    percentualNulos: totalGeralVotosBr > 0 ? Number(((totalVotosNulosBr / totalGeralVotosBr) * 100).toFixed(2)) : 0,
    candidatos: nacionalCandidatos
  };

  // 2. Buscar as 28 localidades (UFs + DF + ZZ) em paralelo
  const ufs = Object.keys(UF_DATA);
  const fetchPromises = ufs.map(async (uf) => {
    const ufLower = uf.toLowerCase();
    const url = `${TSE_CONFIG_2026.baseUrl}/ele${TSE_CONFIG_2026.ano}/${eleicaoCode}/dados/${ufLower}/${ufLower}-${TSE_CONFIG_2026.cargoPresidente}-e00${eleicaoCode}-u.json`;
    try {
      const data = await fetchJson(url);
      const s = data.s || {};
      const urnasTotal = parseInt(s.ts || s.st || UF_DATA[uf].urnasTotal, 10);
      const urnasApuradas = parseInt(s.st || '0', 10);
      const urnasRestantes = Math.max(0, urnasTotal - urnasApuradas);

      const candidatos = [];
      const carg = (data.carg && data.carg[0]) || {};
      (carg.agr || []).forEach(agr => {
        (agr.par || []).forEach(par => {
          (par.cand || []).forEach(c => {
            const num = c.n;
            const meta = CANDIDATE_METADATA[num];
            const name = meta?.shortName || c.nm;
            const party = meta?.party || par.sg || agr.nm || '';
            const color = meta?.color || '#6b7280';
            const badgeColor = meta?.badgeColor || 'bg-gray-600';

            candidatos.push({
              id: num,
              number: num,
              name,
              party,
              color,
              badgeColor,
              votosApurados: parseInt(c.vap || '0', 10)
            });
          });
        });
      });

      const v = data.v || {};
      const votosValidos = parseInt(v.vvc || '0', 10);
      const votosBrancos = parseInt(v.vb || '0', 10);
      const votosNulos = parseInt(v.vn || '0', 10);
      const totalVotos = parseInt(v.tv || '0', 10);

      return {
        uf,
        name: UF_DATA[uf].name,
        region: UF_DATA[uf].region,
        urnasTotal,
        urnasApuradas,
        urnasRestantes,
        votosValidos,
        votosBrancos,
        votosNulos,
        totalVotos,
        candidatos
      };
    } catch (e) {
      return {
        uf,
        name: UF_DATA[uf].name,
        region: UF_DATA[uf].region,
        urnasTotal: UF_DATA[uf].urnasTotal,
        urnasApuradas: 0,
        urnasRestantes: UF_DATA[uf].urnasTotal,
        votosValidos: 0,
        votosBrancos: 0,
        votosNulos: 0,
        totalVotos: 0,
        candidatos: []
      };
    }
  });

  const stateResults = await Promise.all(fetchPromises);
  const candidatesList = Object.values(candMetaMap);

  const payload = {
    success: true,
    status: {
      available: true,
      dg: brData.dg,
      hg: brData.hg,
      st: urnasApuradasBr,
      ts: urnasTotalBr,
      pst: sBr.pst || '0,00'
    },
    nacionalSnapshot,
    states: stateResults,
    candidates: candidatesList
  };

  tseCache = {
    timestamp: now,
    data: payload
  };

  return payload;
}

module.exports = {
  TSE_CONFIG_2026,
  CANDIDATE_METADATA,
  checkTseLiveStatus,
  fetchAllStatesFromTse
};
