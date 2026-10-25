const express = require('express');
const cors = require('cors');
const path = require('path');
const { SimulationEngine, SCENARIOS } = require('./services/simulationEngine');
const { calculateProjections } = require('./services/projectionCalculator');
const { checkTseLiveStatus, fetchAllStatesFromTse } = require('./services/tseService');
const { obterSnapshot, obterDetalheUf, obterIndice, lerSimulacao } = require('./services/segundoTurnoService');
const { lerHistorico } = require('./services/historicoStore');
const { DEFAULT_CANDIDATES_2026 } = require('./data/brazilElectoralData');

const app = express();

app.use(cors());
app.use(express.json());

// Instância do motor de simulação
const simulationEngine = new SimulationEngine();

// Configurações do servidor - Prioriza dados oficiais do TSE
let activeSource = 'tse'; // 'tse' ou 'simulacao'

/**
 * Rota Principal: Retorna dados da apuração atual e projeção final 100%
 */
app.get('/api/apuracao', async (req, res) => {
  try {
    const requestedSource = req.query.source || activeSource;
    let stateRecords = [];
    let currentSource = 'simulacao';
    let tseStatus = { available: false, checked: false };
    let candidatesMeta = simulationEngine.candidates;

    let nacionalSnapshot = null;
    // Se solicitado TSE ou modo padrão, buscar diretamente da API do TSE
    if (requestedSource === 'tse' || requestedSource === 'auto') {
      try {
        const tseResult = await fetchAllStatesFromTse();
        tseStatus = tseResult.status;
        if (tseResult.success && tseResult.states.length > 0) {
          stateRecords = tseResult.states;
          currentSource = 'tse';
          nacionalSnapshot = tseResult.nacionalSnapshot || null;
          if (tseResult.candidates && tseResult.candidates.length > 0) {
            candidatesMeta = tseResult.candidates;
          }
        }
      } catch (err) {
        console.error('Erro ao buscar TSE:', err.message);
        tseStatus = { available: false, error: err.message };
      }
    }

    // Se TSE não tiver dados ou o usuário escolheu simulador, usa o motor de simulação
    if (stateRecords.length === 0) {
      stateRecords = simulationEngine.getStateRecords();
      currentSource = 'simulacao';
      candidatesMeta = simulationEngine.candidates;
    }

    // Calcular projeção matemática a 100% mantendo proporções atuais
    const resultado = calculateProjections(stateRecords, candidatesMeta, nacionalSnapshot);

    // 1º turno encerrado: só o resultado real do TSE vai para o cache longo (a simulação de reserva não)
    res.set('Cache-Control', currentSource === 'tse'
      ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
      : 'no-store');
    res.json({
      success: true,
      source: currentSource,
      requestedSource,
      tseStatus,
      lastUpdated: new Date().toISOString(),
      roundMode: simulationEngine.roundMode,
      activeCandidates: candidatesMeta,
      currentScenario: simulationEngine.currentScenarioId,
      scenariosAvailable: Object.values(SCENARIOS),
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao calcular apuração:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Altera o cenário da simulação
 */
app.post('/api/simulation/scenario', (req, res) => {
  const { scenarioId } = req.body;
  if (!SCENARIOS[scenarioId]) {
    return res.status(400).json({ success: false, message: 'Cenário inválido' });
  }

  simulationEngine.applyScenario(scenarioId);
  activeSource = 'simulacao';

  res.json({
    success: true,
    message: `Cenário alterado para ${SCENARIOS[scenarioId].name}`,
    currentScenario: scenarioId
  });
});

/**
 * Avança a contagem de urnas na simulação (simula o passar do tempo na apuração)
 */
app.post('/api/simulation/advance', (req, res) => {
  const delta = req.body.delta || 0.02;
  const hasMore = simulationEngine.advanceStep(delta);
  res.json({
    success: true,
    hasMore,
    lastUpdated: simulationEngine.lastUpdated
  });
});

/**
 * Altera o turno da eleição ('1' ou '2')
 */
app.post('/api/simulation/round', (req, res) => {
  const { roundMode } = req.body;
  if (roundMode !== '1' && roundMode !== '2') {
    return res.status(400).json({ success: false, message: 'Turno inválido' });
  }
  simulationEngine.setRoundMode(roundMode);
  res.json({
    success: true,
    roundMode: simulationEngine.roundMode,
    candidates: simulationEngine.candidates
  });
});

/**
 * Atualiza os candidatos ativos na simulação
 */
app.post('/api/simulation/candidates', (req, res) => {
  const { candidates } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ success: false, message: 'Lista de candidatos inválida' });
  }
  simulationEngine.setCandidates(candidates);
  res.json({
    success: true,
    candidates: simulationEngine.candidates
  });
});

/**
 * Altera a fonte de dados ('tse' ou 'simulacao')
 */
app.post('/api/config/source', (req, res) => {
  const { source } = req.body;
  if (source !== 'tse' && source !== 'simulacao') {
    return res.status(400).json({ success: false, message: 'Fonte inválida' });
  }
  activeSource = source;
});

const { fetchDeputadosUf } = require('./services/tseDeputadosService');
const { VAGAS_DEPUTADO_FEDERAL } = require('./data/deputadosSeatsData');

/**
 * Rota de Deputados: Retorna o cálculo proporcional de vagas, bancadas e eleitos/suplentes por UF
 */
app.get('/api/deputados', async (req, res) => {
  try {
    const uf = (req.query.uf || 'SP').toUpperCase();
    const cargo = (req.query.cargo || 'federal').toLowerCase();

    if (!VAGAS_DEPUTADO_FEDERAL[uf]) {
      return res.status(400).json({ success: false, message: `UF inválida: ${uf}` });
    }
    if (cargo !== 'federal' && cargo !== 'estadual') {
      return res.status(400).json({ success: false, message: `Cargo inválido. Use 'federal' ou 'estadual'.` });
    }

    const data = await fetchDeputadosUf(uf, cargo);
    // 1º turno encerrado: resultado final, cache longo na CDN poupa a função e o limite do TSE
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar deputados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir arquivos estáticos do frontend em produção se compilado
/**
 * 2º turno: projeções por par município × zona (métricas 1 e 2), detalhe por UF e índice para a busca.
 * O cache da CDN (s-maxage + stale-while-revalidate) faz uma única função atualizar os dados por vez.
 */
app.get('/api/segundo-turno', async (req, res) => {
  try {
    const dados = await obterSnapshot({ simular: req.query.simular });
    res.set('Cache-Control', dados.simulacao ? 'public, max-age=0, s-maxage=300' : 'public, max-age=0, s-maxage=15, stale-while-revalidate=45');
    res.json(dados);
  } catch (error) {
    console.error('Erro no 2º turno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/segundo-turno/indice', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.json(obterIndice());
});

app.get('/api/segundo-turno/historico', async (req, res) => {
  const corrida = String(req.query.corrida || '');
  if (!/^(presidente|governador)-[a-z]{2}$/.test(corrida)) {
    return res.status(400).json({ success: false, error: 'corrida inválida' });
  }
  try {
    const { disponivel, pontos } = await lerHistorico(corrida);
    res.set('Cache-Control', disponivel ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' : 'public, max-age=0, s-maxage=60');
    res.json({ success: true, disponivel, corrida, pontos });
  } catch (error) {
    console.error('Erro ao ler histórico do 2º turno:', error.message);
    res.status(502).json({ success: false, disponivel: false, corrida, pontos: [] });
  }
});

app.get('/api/segundo-turno/uf/:uf', async (req, res) => {
  try {
    const dados = await obterDetalheUf(req.params.uf, req.query.cargo, { simular: req.query.simular });
    if (!dados) return res.status(404).json({ success: false, error: 'UF ou cargo sem 2º turno' });
    res.set('Cache-Control', lerSimulacao(req.query.simular) !== null ? 'public, max-age=0, s-maxage=300' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    res.json(dados);
  } catch (error) {
    console.error('Erro no detalhe do 2º turno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

module.exports = app;
