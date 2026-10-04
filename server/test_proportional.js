const { fetchDeputadosUf } = require('./services/tseDeputadosService');

async function run() {
  console.log('=== TESTE DEPUTADOS FEDERAIS E ESTADUAIS ===');
  const ufs = ['SP', 'DF', 'MG'];

  for (const uf of ufs) {
    console.log(`\n--- Testando ${uf} (Federal) ---`);
    const resFed = await fetchDeputadosUf(uf, 'federal');
    console.log(`Cargo: ${resFed.cargoNome} | Vagas: ${resFed.totalVagas} | Vagas Distribuídas: ${resFed.vagasDistribuidas}`);
    console.log(`QE: ${resFed.quocienteEleitoral.toLocaleString('pt-BR')} | Votos Válidos: ${resFed.totalVotosValidos.toLocaleString('pt-BR')} | Urnas: ${resFed.urnasInfo.percentualApurado}%`);
    console.log('Top Bancadas Eleitas:');
    resFed.partidos.slice(0, 5).forEach(p => {
      console.log(`- ${p.sigla}: ${p.totalVagas} vagas (QP: ${p.vagasQP}, Sobras: ${p.vagasSobras}) | Votos: ${p.votosTotais.toLocaleString('pt-BR')} (${p.percentualValidos}%)`);
      if (p.candidatosEntrando.length > 0) {
        const top3 = p.candidatosEntrando.slice(0, 3).map(c => `${c.nomeUrna} [${c.tipoVaga}] (${c.votosNominais.toLocaleString('pt-BR')} votos)`).join(', ');
        console.log(`   Entrando: ${top3}`);
      }
      if (p.candidatosFicandoDeFora.length > 0) {
        const primeiroSuplente = p.candidatosFicandoDeFora[0];
        console.log(`   1º Ficando de fora: ${primeiroSuplente.nomeUrna} (${primeiroSuplente.votosNominais.toLocaleString('pt-BR')} votos, faltou ${primeiroSuplente.diferencaParaEntrar?.toLocaleString('pt-BR')} votos)`);
      }
    });

    console.log(`\n--- Testando ${uf} (${uf === 'DF' ? 'Distrital' : 'Estadual'}) ---`);
    const resEst = await fetchDeputadosUf(uf, 'estadual');
    console.log(`Cargo: ${resEst.cargoNome} | Vagas: ${resEst.totalVagas} | Vagas Distribuídas: ${resEst.vagasDistribuidas}`);
    console.log(`QE: ${resEst.quocienteEleitoral.toLocaleString('pt-BR')} | Top Bancada: ${resEst.partidos[0]?.sigla} com ${resEst.partidos[0]?.totalVagas} vagas`);
  }
}

run().catch(console.error);
