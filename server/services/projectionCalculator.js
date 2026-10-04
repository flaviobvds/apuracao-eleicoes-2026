/**
 * Motor Matemático de Projeção a 100% dos Votos Válidos
 * 
 * Regra: Mantém as proporções atuais observadas para cada candidato em cada UF
 * e projeta o total de votos restantes com base no percentual de urnas apuradas.
 */

const { REGIONS } = require('../data/brazilElectoralData');

function calculateProjections(stateRecords, candidateMeta, nacionalSnapshot = null) {
  // 1. Processar projeções por estado (UF)
  const processedStates = stateRecords.map((st) => {
    const urnasTotal = st.urnasTotal;
    const urnasApuradas = Math.min(st.urnasApuradas, urnasTotal);
    const urnasRestantes = Math.max(0, urnasTotal - urnasApuradas);
    const percentualApurado = urnasTotal > 0 ? (urnasApuradas / urnasTotal) * 100 : 0;

    const expansionFactor = urnasApuradas > 0 ? urnasTotal / urnasApuradas : 1;

    let totalVotosValidosApurados = 0;
    st.candidatos.forEach(c => {
      totalVotosValidosApurados += (c.votosApurados || 0);
    });

    const candidatosProcessados = st.candidatos.map((c) => {
      const votosApurados = c.votosApurados || 0;
      const percentualAtual = totalVotosValidosApurados > 0 
        ? (votosApurados / totalVotosValidosApurados) * 100 
        : 0;

      const votosProjetados = urnasApuradas > 0
        ? Math.round(votosApurados * expansionFactor)
        : votosApurados;

      const votosRestantesEstimados = Math.max(0, votosProjetados - votosApurados);

      return {
        id: c.id,
        number: c.number,
        name: c.name,
        party: c.party,
        color: c.color,
        votosApurados,
        percentualAtual: Number(percentualAtual.toFixed(2)),
        votosProjetados,
        percentualProjetado: Number(percentualAtual.toFixed(2)),
        votosRestantesEstimados
      };
    });

    candidatosProcessados.sort((a, b) => b.votosProjetados - a.votosProjetados);

    const lider = candidatosProcessados[0] || null;
    const viceLider = candidatosProcessados[1] || null;
    const vantagem = (lider && viceLider) 
      ? Number((lider.percentualAtual - viceLider.percentualAtual).toFixed(2)) 
      : 0;

    const totalVotosValidosProjetados = candidatosProcessados.reduce(
      (acc, c) => acc + c.votosProjetados, 0
    );

    return {
      uf: st.uf,
      name: st.name,
      region: st.region,
      urnasTotal,
      urnasApuradas,
      urnasRestantes,
      percentualApurado: Number(percentualApurado.toFixed(2)),
      totalVotosValidosApurados,
      totalVotosValidosProjetados,
      votosRestantesTotal: totalVotosValidosProjetados - totalVotosValidosApurados,
      votosBrancos: st.votosBrancos || 0,
      votosNulos: st.votosNulos || 0,
      totalVotos: st.totalVotos || totalVotosValidosApurados,
      lider,
      vantagem,
      candidatos: candidatosProcessados
    };
  });

  // 2. Agregação Nacional
  const nacionalUrnasTotal = nacionalSnapshot?.urnasTotal || processedStates.reduce((acc, s) => acc + s.urnasTotal, 0);
  const nacionalUrnasApuradas = nacionalSnapshot?.urnasApuradas || processedStates.reduce((acc, s) => acc + s.urnasApuradas, 0);
  const nacionalUrnasRestantes = nacionalSnapshot?.urnasRestantes || (nacionalUrnasTotal - nacionalUrnasApuradas);
  const nacionalPercentualApurado = nacionalSnapshot?.percentualApurado || (nacionalUrnasTotal > 0 ? (nacionalUrnasApuradas / nacionalUrnasTotal) * 100 : 0);

  // Mapear snapshot para votos apurados atuais oficiais
  const snapMap = {};
  if (nacionalSnapshot?.candidatos) {
    nacionalSnapshot.candidatos.forEach(sc => {
      snapMap[sc.id] = sc;
    });
  }

  // Acumuladores de candidatos a nível Brasil
  const candTotalsMap = {};
  candidateMeta.forEach(cm => {
    candTotalsMap[cm.id] = {
      ...cm,
      votosApurados: snapMap[cm.id]?.votosApurados || 0,
      percentualAtual: snapMap[cm.id]?.percentualAtual !== undefined ? snapMap[cm.id].percentualAtual : 0,
      votosProjetados: 0,
      votosRestantesEstimados: 0,
      estadosLiderados: 0,
      ufsLideradas: 0,
      lideraDf: false,
      lideraExterior: false,
      ufsLideradasList: []
    };
  });

  processedStates.forEach(s => {
    if (s.lider && candTotalsMap[s.lider.id]) {
      candTotalsMap[s.lider.id].ufsLideradasList.push(s.uf);
      if (s.uf === 'DF') {
        candTotalsMap[s.lider.id].lideraDf = true;
        candTotalsMap[s.lider.id].ufsLideradas += 1;
      } else if (s.uf === 'ZZ') {
        candTotalsMap[s.lider.id].lideraExterior = true;
      } else {
        candTotalsMap[s.lider.id].estadosLiderados += 1;
        candTotalsMap[s.lider.id].ufsLideradas += 1;
      }
    }
    s.candidatos.forEach(c => {
      if (!candTotalsMap[c.id]) {
        candTotalsMap[c.id] = {
          id: c.id,
          number: c.number,
          name: c.name,
          party: c.party,
          color: c.color,
          votosApurados: snapMap[c.id]?.votosApurados || c.votosApurados,
          percentualAtual: snapMap[c.id]?.percentualAtual !== undefined ? snapMap[c.id].percentualAtual : 0,
          votosProjetados: 0,
          votosRestantesEstimados: 0,
          estadosLiderados: 0,
          ufsLideradas: 0,
          lideraDf: false,
          lideraExterior: false,
          ufsLideradasList: []
        };
      }
      // Votos projetados calculados pela soma das expansões estaduais
      candTotalsMap[c.id].votosProjetados += c.votosProjetados;
    });
  });

  // Se não veio do snapshot oficial BR, calcula a soma das UFs
  const totalNacionalValidosApurados = nacionalSnapshot?.totalVotosValidosApurados 
    || Object.values(candTotalsMap).reduce((acc, c) => acc + c.votosApurados, 0);

  const totalNacionalValidosProjetados = Object.values(candTotalsMap)
    .reduce((acc, c) => acc + c.votosProjetados, 0);

  const candidatosNacional = Object.values(candTotalsMap).map(c => {
    const percentualAtual = c.percentualAtual !== undefined && snapMap[c.id]
      ? c.percentualAtual
      : (totalNacionalValidosApurados > 0 ? (c.votosApurados / totalNacionalValidosApurados) * 100 : 0);

    const percentualProjetado = totalNacionalValidosProjetados > 0 
      ? (c.votosProjetados / totalNacionalValidosProjetados) * 100 
      : 0;

    const deltaPercentual = percentualProjetado - percentualAtual;
    const votosRestantesEstimados = Math.max(0, c.votosProjetados - c.votosApurados);

    // Texto descritivo rigoroso de liderança territorial
    let textoLideranca = '';
    if (c.ufsLideradas > 0 || c.lideraExterior) {
      const partes = [];
      if (c.estadosLiderados > 0) {
        partes.push(`${c.estadosLiderados} ${c.estadosLiderados === 1 ? 'estado' : 'estados'}`);
      }
      if (c.lideraDf) {
        partes.push('DF');
      }
      const base = partes.join(' + ');
      if (c.lideraExterior) {
        textoLideranca = base ? `${base} (+ Exterior)` : 'Exterior';
      } else {
        textoLideranca = base;
      }
    }

    return {
      id: c.id,
      number: c.number,
      name: c.name,
      party: c.party,
      color: c.color,
      badgeColor: c.badgeColor,
      votosApurados: c.votosApurados,
      percentualAtual: Number(percentualAtual.toFixed(2)),
      votosProjetados: c.votosProjetados,
      percentualProjetado: Number(percentualProjetado.toFixed(2)),
      deltaPercentual: Number(deltaPercentual.toFixed(2)),
      votosRestantesEstimados,
      estadosLiderados: c.estadosLiderados,
      ufsLideradas: c.ufsLideradas,
      lideraDf: c.lideraDf,
      lideraExterior: c.lideraExterior,
      textoLideranca,
      ufsLideradasList: c.ufsLideradasList
    };
  });

  // Ordenar candidatos a nível nacional por votos apurados atuais
  candidatosNacional.sort((a, b) => b.votosApurados - a.votosApurados);

  // 3. Agregação por Região
  const regioesProcessadas = Object.keys(REGIONS).map(regKey => {
    const regMeta = REGIONS[regKey];
    const statesInRegion = processedStates.filter(s => s.region === regKey);

    const urnasTotal = statesInRegion.reduce((acc, s) => acc + s.urnasTotal, 0);
    const urnasApuradas = statesInRegion.reduce((acc, s) => acc + s.urnasApuradas, 0);
    const urnasRestantes = urnasTotal - urnasApuradas;
    const percentualApurado = urnasTotal > 0 ? (urnasApuradas / urnasTotal) * 100 : 0;

    const totalValidosApurados = statesInRegion.reduce((acc, s) => acc + s.totalVotosValidosApurados, 0);
    const totalValidosProjetados = statesInRegion.reduce((acc, s) => acc + s.totalVotosValidosProjetados, 0);
    const votosRestantesTotal = totalValidosProjetados - totalValidosApurados;

    // Consolidar candidatos na região
    const regCandMap = {};
    candidateMeta.forEach(cm => {
      regCandMap[cm.id] = { ...cm, votosApurados: 0, votosProjetados: 0, votosRestantesEstimados: 0 };
    });

    statesInRegion.forEach(s => {
      s.candidatos.forEach(c => {
        if (!regCandMap[c.id]) {
          regCandMap[c.id] = { id: c.id, number: c.number, name: c.name, party: c.party, color: c.color, votosApurados: 0, votosProjetados: 0, votosRestantesEstimados: 0 };
        }
        regCandMap[c.id].votosApurados += c.votosApurados;
        regCandMap[c.id].votosProjetados += c.votosProjetados;
        regCandMap[c.id].votosRestantesEstimados += c.votosRestantesEstimados;
      });
    });

    const candidatosRegiao = Object.values(regCandMap).map(c => {
      const percentualAtual = totalValidosApurados > 0 
        ? (c.votosApurados / totalValidosApurados) * 100 
        : 0;

      const percentualProjetado = totalValidosProjetados > 0 
        ? (c.votosProjetados / totalValidosProjetados) * 100 
        : 0;

      const deltaPercentual = percentualProjetado - percentualAtual;

      return {
        id: c.id,
        number: c.number,
        name: c.name,
        party: c.party,
        color: c.color,
        votosApurados: c.votosApurados,
        percentualAtual: Number(percentualAtual.toFixed(2)),
        votosProjetados: c.votosProjetados,
        percentualProjetado: Number(percentualProjetado.toFixed(2)),
        deltaPercentual: Number(deltaPercentual.toFixed(2)),
        votosRestantesEstimados: c.votosRestantesEstimados
      };
    });

    candidatosRegiao.sort((a, b) => b.votosProjetados - a.votosProjetados);

    const liderRegiao = candidatosRegiao[0] || null;

    // Participação das urnas pendentes desta região em relação ao Brasil
    const pesoUrnasRestantesNacional = nacionalUrnasRestantes > 0
      ? (urnasRestantes / nacionalUrnasRestantes) * 100
      : 0;

    return {
      id: regMeta.id,
      name: regMeta.name,
      color: regMeta.color,
      estadosCount: statesInRegion.length,
      urnasTotal,
      urnasApuradas,
      urnasRestantes,
      percentualApurado: Number(percentualApurado.toFixed(2)),
      pesoUrnasRestantesNacional: Number(pesoUrnasRestantesNacional.toFixed(2)),
      totalValidosApurados,
      totalValidosProjetados,
      votosRestantesTotal,
      lider: liderRegiao,
      candidatos: candidatosRegiao,
      estados: statesInRegion.map(s => ({
        uf: s.uf,
        name: s.name,
        urnasTotal: s.urnasTotal,
        urnasApuradas: s.urnasApuradas,
        urnasRestantes: s.urnasRestantes,
        percentualApurado: s.percentualApurado,
        lider: s.lider
      }))
    };
  });

  const totalNacionalBrancos = stateRecords.reduce((acc, s) => acc + (s.votosBrancos || 0), 0);
  const totalNacionalNulos = stateRecords.reduce((acc, s) => acc + (s.votosNulos || 0), 0);
  const totalNacionalGeral = totalNacionalValidosApurados + totalNacionalBrancos + totalNacionalNulos;

  return {
    nacional: {
      urnasTotal: nacionalUrnasTotal,
      urnasApuradas: nacionalUrnasApuradas,
      urnasRestantes: nacionalUrnasRestantes,
      percentualApurado: Number(nacionalPercentualApurado.toFixed(2)),
      totalVotosValidosApurados: totalNacionalValidosApurados,
      totalVotosValidosProjetados: totalNacionalValidosProjetados,
      votosRestantesTotal: totalNacionalValidosProjetados - totalNacionalValidosApurados,
      totalVotosBrancos: totalNacionalBrancos,
      totalVotosNulos: totalNacionalNulos,
      totalGeralVotos: totalNacionalGeral,
      percentualValidos: totalNacionalGeral > 0 ? Number(((totalNacionalValidosApurados / totalNacionalGeral) * 100).toFixed(2)) : 100,
      percentualBrancos: totalNacionalGeral > 0 ? Number(((totalNacionalBrancos / totalNacionalGeral) * 100).toFixed(2)) : 0,
      percentualNulos: totalNacionalGeral > 0 ? Number(((totalNacionalNulos / totalNacionalGeral) * 100).toFixed(2)) : 0,
      candidatos: candidatosNacional
    },
    regioes: regioesProcessadas,
    estados: processedStates
  };
}

module.exports = {
  calculateProjections
};
