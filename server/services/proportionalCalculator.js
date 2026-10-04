/**
 * Motor de Cálculo Proporcional do TSE
 * Implementa Quociente Eleitoral (QE), Quociente Partidário (QP),
 * Cláusula de Desempenho Individual (10% e 20% do QE) e Distribuição de Sobras (D'Hondt / STF ADI 7228/7263)
 */

const { getPartyColor } = require('../data/deputadosSeatsData');

/**
 * Calcula a distribuição de vagas e separa candidatos eleitos e suplentes
 * @param {Object} params
 * @param {string} params.uf Sigla da UF
 * @param {string} params.cargo 'federal' ou 'estadual'
 * @param {number} params.totalVagas Total de cadeiras da UF
 * @param {Array} params.rawPartidos Lista de partidos e candidatos
 * @param {number} params.totalVotosValidos Total de votos válidos nominais + legenda da UF
 * @param {Object} params.urnasInfo Informações de urnas apuradas
 */
function calculateProportionalDistribution({
  uf,
  cargo,
  totalVagas,
  rawPartidos,
  totalVotosValidos,
  urnasInfo = {}
}) {
  // 1. Quociente Eleitoral (QE)
  // Art. 106 do Código Eleitoral: votos válidos divididos pelo número de vagas,
  // desprezada a fração se igual ou inferior a 0,5, arredondada para 1 se superior.
  const qe = totalVagas > 0 ? Math.max(1, Math.round(totalVotosValidos / totalVagas)) : 1;
  
  // Cláusulas de Barreira Individual (Lei 14.211/2021)
  const minVotosNominaisQP = Math.ceil(0.10 * qe);      // 10% do QE para entrar pelo QP
  const minVotosPartidoSobra = 0.80 * qe;             // 80% do QE para partido disputar sobra inicial
  const minVotosNominaisSobra = Math.ceil(0.20 * qe);    // 20% do QE para candidato entrar na 1ª fase de sobras

  // Preparar estrutura dos partidos
  const partidos = rawPartidos.map(p => {
    // Ordenar candidatos decrescentemente por votos nominais
    const candidatosSorted = [...(p.candidatos || [])].sort((a, b) => b.votosNominais - a.votosNominais);

    return {
      sigla: p.sigla || 'OUTROS',
      nome: p.nome || p.sigla || 'Partido',
      numero: p.numero,
      color: getPartyColor(p.sigla),
      votosNominais: p.votosNominais || 0,
      votosLegenda: p.votosLegenda || 0,
      votosTotais: p.votosTotais || (p.votosNominais + p.votosLegenda),
      percentualValidos: totalVotosValidos > 0 
        ? Number(((p.votosTotais / totalVotosValidos) * 100).toFixed(2)) 
        : 0,
      candidatos: candidatosSorted,
      vagasQP: 0,
      vagasSobras: 0,
      vagasObtidas: 0,
      candidatosEleitos: [],
      candidatosSuplentes: []
    };
  });

  // 2. Cálculo do Quociente Partidário (QP)
  // Art. 107 e 108: QP = floor(votos do partido / QE)
  let vagasDistribuidasQP = 0;

  partidos.forEach(p => {
    const qpBruto = Math.floor(p.votosTotais / qe);

    // Contar candidatos que atingiram o mínimo individual de 10% do QE
    const aptosQP = p.candidatos.filter(c => c.votosNominais >= minVotosNominaisQP);

    // Vagas efetivas do QP limitadas ao número de candidatos aptos
    const vagasEfetivasQP = Math.min(qpBruto, aptosQP.length);

    p.vagasQP = vagasEfetivasQP;
    p.vagasObtidas = vagasEfetivasQP;
    vagasDistribuidasQP += vagasEfetivasQP;

    // Alocar os primeiros candidatos aptos no QP
    for (let i = 0; i < vagasEfetivasQP; i++) {
      p.candidatosEleitos.push({
        ...aptosQP[i],
        tipoVaga: 'QP',
        ordemEleito: i + 1
      });
    }
  });

  // 3. Distribuição das Sobras (Maiores Médias - Método D'Hondt)
  // Art. 109 do Código Eleitoral e Decisão do STF (ADIs 7228 e 7263)
  let vagasRestantes = Math.max(0, totalVagas - vagasDistribuidasQP);

  while (vagasRestantes > 0) {
    let melhorPartido = null;
    let maiorMedia = -1;

    // Tentativa 1: Partidos com >= 80% do QE que possuam candidatos com >= 20% do QE
    const partidosFase1 = partidos.filter(p => {
      if (p.votosTotais < minVotosPartidoSobra) return false;
      const jaEleitosIds = new Set(p.candidatosEleitos.map(c => c.numero || c.nome));
      const proximoCand = p.candidatos.find(c => !jaEleitosIds.has(c.numero || c.nome));
      return proximoCand && proximoCand.votosNominais >= minVotosNominaisSobra;
    });

    // Se houver partidos elegíveis na Fase 1, disputa entre eles
    const listaDisputa = partidosFase1.length > 0 ? partidosFase1 : partidos.filter(p => {
      // Fase 2 (Regra STF de sobras remanescentes): Qualquer partido que ainda tenha candidatos
      const jaEleitosIds = new Set(p.candidatosEleitos.map(c => c.numero || c.nome));
      return p.candidatos.some(c => !jaEleitosIds.has(c.numero || c.nome));
    });

    if (listaDisputa.length === 0) {
      // Nenhum candidato restante em nenhum partido
      break;
    }

    listaDisputa.forEach(p => {
      // Média = Votos Totais / (Vagas Já Obtidas + 1)
      const media = p.votosTotais / (p.vagasObtidas + 1);
      if (media > maiorMedia) {
        maiorMedia = media;
        melhorPartido = p;
      }
    });

    if (!melhorPartido) break;

    // Atribuir 1 vaga de sobra ao partido vencedor da rodada
    melhorPartido.vagasSobras += 1;
    melhorPartido.vagasObtidas += 1;
    vagasRestantes -= 1;

    // Selecionar o próximo candidato mais votado ainda não eleito
    const jaEleitosIds = new Set(melhorPartido.candidatosEleitos.map(c => c.numero || c.nome));
    const proximoCand = melhorPartido.candidatos.find(c => !jaEleitosIds.has(c.numero || c.nome));
    if (proximoCand) {
      melhorPartido.candidatosEleitos.push({
        ...proximoCand,
        tipoVaga: 'MÉDIA',
        ordemEleito: melhorPartido.candidatosEleitos.length + 1
      });
    }
  }

  // 4. Separar Candidatos Eleitos ("Entrando") e Suplentes ("Ficando de Fora")
  partidos.forEach(p => {
    const jaEleitosIds = new Set(p.candidatosEleitos.map(c => c.numero || c.nome));
    
    // Todos os demais candidatos do partido que não entraram
    const suplentes = p.candidatos
      .filter(c => !jaEleitosIds.has(c.numero || c.nome))
      .map((c, index) => {
        // Último eleito do partido para calcular a diferença de votos
        const ultimoEleito = p.candidatosEleitos[p.candidatosEleitos.length - 1];
        const diferenca = ultimoEleito ? Math.max(1, ultimoEleito.votosNominais - c.votosNominais + 1) : null;
        return {
          ...c,
          ordemSuplente: index + 1,
          diferencaParaEntrar: diferenca
        };
      });

    p.candidatosSuplentes = suplentes;
  });

  // 5. Ordenar Partidos por Total de Vagas (Ordem Decrescente)
  // Conforme solicitação do usuário: primeiro partidos com mais vagas, depois por total de votos
  partidos.sort((a, b) => {
    if (b.vagasObtidas !== a.vagasObtidas) {
      return b.vagasObtidas - a.vagasObtidas;
    }
    return b.votosTotais - a.votosTotais;
  });

  return {
    uf,
    cargo,
    totalVagas,
    vagasDistribuidas: totalVagas - vagasRestantes,
    quocienteEleitoral: qe,
    minVotosNominaisQP,
    minVotosNominaisSobra,
    totalVotosValidos,
    urnasInfo,
    partidos: partidos.map(p => ({
      sigla: p.sigla,
      nome: p.nome,
      numero: p.numero,
      color: p.color,
      votosTotais: p.votosTotais,
      votosNominais: p.votosNominais,
      votosLegenda: p.votosLegenda,
      percentualValidos: p.percentualValidos,
      totalVagas: p.vagasObtidas,
      vagasQP: p.vagasQP,
      vagasSobras: p.vagasSobras,
      // Candidatos que estão entrando (Eleitos)
      candidatosEntrando: p.candidatosEleitos,
      // Candidatos que estão ficando de fora (Suplentes)
      candidatosFicandoDeFora: p.candidatosSuplentes.slice(0, 10), // Primeiros 10 suplentes
      totalSuplentes: p.candidatosSuplentes.length
    }))
  };
}

module.exports = {
  calculateProportionalDistribution
};
