const express = require('express');
const cors = require('cors');
const path = require('path');
const { SimulationEngine, SCENARIOS } = require('./services/simulationEngine');
const { calculateProjections } = require('./services/projectionCalculator');
const { checkTseLiveStatus, fetchAllStatesFromTse } = require('./services/tseService');
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
  res.json({ success: true, source: activeSource });
});

// Servir arquivos estáticos do frontend em produção se compilado
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

module.exports = app;
