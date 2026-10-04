const { SimulationEngine } = require('./services/simulationEngine');
const { calculateProjections } = require('./services/projectionCalculator');

const engine = new SimulationEngine();
const records = engine.getStateRecords();
const result = calculateProjections(records, engine.candidates);

console.log('--- TESTE NACIONAL ---');
console.log('Urnas Total:', result.nacional.urnasTotal);
console.log('Urnas Apuradas:', result.nacional.urnasApuradas);
console.log('Urnas Restantes:', result.nacional.urnasRestantes);
console.log('% Apurado:', result.nacional.percentualApurado + '%');
console.log('Candidatos Nacional:');
result.nacional.candidatos.forEach(c => {
  const sign = c.deltaPercentual > 0 ? '+' : '';
  console.log(`- ${c.name} (${c.party}): Atual ${c.percentualAtual}% -> Projetado ${c.percentualProjetado}% (Delta: ${sign}${c.deltaPercentual}%) | Votos Restantes: ${c.votosRestantesEstimados.toLocaleString('pt-BR')}`);
});
console.log('Regiões:', result.regioes.length);
console.log('Estados:', result.estados.length);
