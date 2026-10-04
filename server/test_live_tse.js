const { fetchAllStatesFromTse } = require('./services/tseService');
const { calculateProjections } = require('./services/projectionCalculator');

(async () => {
  console.log('Consultando dados oficiais ao vivo do TSE...');
  const result = await fetchAllStatesFromTse();
  console.log('TSE fetch success:', result.success);
  console.log('States fetched count:', result.states.length);
  if (result.states.length > 0) {
    const candMap = {};
    result.states.forEach(st => {
      st.candidatos.forEach(c => {
        candMap[c.id] = { id: c.id, number: c.number, name: c.name, party: c.party };
      });
    });
    const cands = Object.values(candMap);
    console.log('Candidatos identificados:', cands.length);
    const proj = calculateProjections(result.states, cands);
    console.log('Nacional Urnas Total:', proj.nacional.urnasTotal);
    console.log('Nacional Urnas Apuradas:', proj.nacional.urnasApuradas);
    console.log('Nacional Urnas Restantes:', proj.nacional.urnasRestantes);
    console.log('Nacional % Apurado:', proj.nacional.percentualApurado + '%');
    console.log('--- PLACAR REAL TSE (ATUAL VS PROJETADO) ---');
    proj.nacional.candidatos.forEach(c => {
      const sign = c.deltaPercentual > 0 ? '+' : '';
      console.log(`- ${c.name} (${c.party}): Atual ${c.percentualAtual}% -> Proj ${c.percentualProjetado}% (${sign}${c.deltaPercentual}%) | Votos: ${c.votosApurados.toLocaleString('pt-BR')}`);
    });
  }
})();
