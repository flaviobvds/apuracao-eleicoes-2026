/**
 * Motor de Simulação Eleitoral Presidencial 2026
 * Gera cenários dinâmicos e realistas de apuração com ritmo diferenciado por região
 * e proporções de votos calibradas por estado para os candidatos a Presidente da República.
 */

const { 
  UF_DATA, 
  DEFAULT_CANDIDATES_2026, 
  CANDIDATES_2ND_ROUND_2026, 
  AVG_VALID_VOTES_PER_URNA 
} = require('../data/brazilElectoralData');

// Tendências de proporção de votos válidos por região para Presidente 2026
// Calibradas com a apuração real: Flávio Bolsonaro lidera no Sul, Sudeste, Centro-Oeste e Norte; Lula lidera no Nordeste
const REGIONAL_PROPORTIONS = {
  NORDESTE: { '13': 0.64, '22': 0.28, '70': 0.02, '14': 0.02, '55': 0.02, '30': 0.01, '99': 0.01 },
  NORTE: { '13': 0.43, '22': 0.49, '70': 0.03, '14': 0.02, '55': 0.02, '30': 0.01, '99': 0.00 },
  SUDESTE: { '13': 0.40, '22': 0.50, '70': 0.03, '14': 0.03, '55': 0.02, '30': 0.01, '99': 0.01 },
  SUL: { '13': 0.33, '22': 0.57, '70': 0.03, '14': 0.03, '55': 0.02, '30': 0.01, '99': 0.01 },
  CENTRO_OESTE: { '13': 0.32, '22': 0.52, '55': 0.07, '70': 0.03, '14': 0.03, '30': 0.02, '99': 0.01 },
  EXTERIOR: { '13': 0.48, '22': 0.44, '70': 0.02, '14': 0.03, '55': 0.01, '30': 0.01, '99': 0.01 },
};

// Variações específicas por UF para mais fidelidade à disputa presidencial
const STATE_PROPORTION_OVERRIDES = {
  SP: { '13': 0.43, '22': 0.48, '55': 0.03, '30': 0.02, '14': 0.02, '70': 0.01, '99': 0.01 },
  RJ: { '13': 0.42, '22': 0.50, '55': 0.03, '30': 0.01, '14': 0.02, '70': 0.01, '99': 0.01 },
  MG: { '13': 0.47, '22': 0.40, '55': 0.03, '30': 0.07, '14': 0.01, '70': 0.01, '99': 0.01 }, // Zema forte em MG
  GO: { '13': 0.28, '22': 0.41, '55': 0.24, '30': 0.02, '14': 0.02, '70': 0.01, '99': 0.02 }, // Caiado forte em GO
  BA: { '13': 0.70, '22': 0.22, '55': 0.03, '30': 0.01, '14': 0.02, '70': 0.01, '99': 0.01 },
  RS: { '13': 0.42, '22': 0.49, '55': 0.03, '30': 0.02, '14': 0.02, '70': 0.01, '99': 0.01 },
  SC: { '13': 0.28, '22': 0.63, '55': 0.03, '30': 0.02, '14': 0.02, '70': 0.01, '99': 0.01 },
  PR: { '13': 0.35, '22': 0.55, '55': 0.04, '30': 0.02, '14': 0.02, '70': 0.01, '99': 0.01 },
  DF: { '13': 0.38, '22': 0.50, '55': 0.05, '30': 0.02, '14': 0.03, '70': 0.01, '99': 0.01 },
  PI: { '13': 0.74, '22': 0.20, '55': 0.02, '30': 0.01, '14': 0.01, '70': 0.01, '99': 0.01 },
  MA: { '13': 0.70, '22': 0.23, '55': 0.03, '30': 0.01, '14': 0.01, '70': 0.01, '99': 0.01 },
};

// Cenários de apuração
const SCENARIOS = {
  REGIONAL_MISMATCH: {
    id: 'REGIONAL_MISMATCH',
    name: 'Descompasso Regional Típico (Sul/Sudeste adiantados)',
    description: 'Sudeste e Sul com apuração acelerada (~75%), Nordeste e Norte atrasados (~35%). Evidencia o poder da projeção!',
    rates: {
      SUDESTE: 0.74,
      SUL: 0.81,
      CENTRO_OESTE: 0.62,
      NORDESTE: 0.36,
      NORTE: 0.29,
      EXTERIOR: 0.98
    }
  },
  EARLY_COUNT: {
    id: 'EARLY_COUNT',
    name: 'Início da Apuração (20% Brasil)',
    description: 'Primeiras urnas sendo totalizadas em todo o país.',
    rates: {
      SUDESTE: 0.22,
      SUL: 0.28,
      CENTRO_OESTE: 0.19,
      NORDESTE: 0.15,
      NORTE: 0.12,
      EXTERIOR: 0.85
    }
  },
  BALANCED_HALF: {
    id: 'BALANCED_HALF',
    name: 'Metade Apurada Homogênea (50% Brasil)',
    description: 'Todas as regiões exatamente na marca dos 50% apurados.',
    rates: {
      SUDESTE: 0.50,
      SUL: 0.50,
      CENTRO_OESTE: 0.50,
      NORDESTE: 0.50,
      NORTE: 0.50,
      EXTERIOR: 0.50
    }
  },
  FINAL_STRETCH: {
    id: 'FINAL_STRETCH',
    name: 'Reta Final (92% Brasil)',
    description: 'Apenas as últimas seções de difícil acesso e urnas de contingência pendentes.',
    rates: {
      SUDESTE: 0.96,
      SUL: 0.98,
      CENTRO_OESTE: 0.95,
      NORDESTE: 0.89,
      NORTE: 0.84,
      EXTERIOR: 1.00
    }
  },
  FULL_COUNT: {
    id: 'FULL_COUNT',
    name: '100% Apurado (Totalidade)',
    description: 'Todas as urnas do Brasil apuradas. Projeção coincide 100% com o resultado final.',
    rates: {
      SUDESTE: 1.00,
      SUL: 1.00,
      CENTRO_OESTE: 1.00,
      NORDESTE: 1.00,
      NORTE: 1.00,
      EXTERIOR: 1.00
    }
  }
};

class SimulationEngine {
  constructor() {
    this.currentScenarioId = 'REGIONAL_MISMATCH';
    this.customProgress = {}; // uf -> float 0.0 a 1.0
    this.candidates = [...DEFAULT_CANDIDATES_2026];
    this.roundMode = '1'; // '1' ou '2'
    this.isAutoAdvancing = false;
    this.lastUpdated = new Date().toISOString();
    this.applyScenario(this.currentScenarioId);
  }

  setRoundMode(mode) {
    if (mode === '2') {
      this.roundMode = '2';
      this.candidates = [...CANDIDATES_2ND_ROUND_2026];
    } else {
      this.roundMode = '1';
      this.candidates = [...DEFAULT_CANDIDATES_2026];
    }
    this.lastUpdated = new Date().toISOString();
  }

  setCandidates(newCandidates) {
    if (Array.isArray(newCandidates) && newCandidates.length > 0) {
      this.candidates = newCandidates;
      this.lastUpdated = new Date().toISOString();
    }
  }

  applyScenario(scenarioId) {
    const scenario = SCENARIOS[scenarioId] || SCENARIOS.REGIONAL_MISMATCH;
    this.currentScenarioId = scenario.id;

    // Preencher progresso por UF com pequena variação orgânica
    Object.keys(UF_DATA).forEach(uf => {
      const ufMeta = UF_DATA[uf];
      const baseRate = scenario.rates[ufMeta.region] || 0.5;
      const noise = ((uf.charCodeAt(0) * 7 + uf.charCodeAt(1) * 13) % 9 - 4) * 0.01;
      const rate = Math.min(1.0, Math.max(0.01, baseRate + noise));
      this.customProgress[uf] = rate;
    });

    this.lastUpdated = new Date().toISOString();
  }

  advanceStep(deltaPercentage = 0.02) {
    let allCompleted = true;
    Object.keys(UF_DATA).forEach(uf => {
      const current = this.customProgress[uf] || 0;
      if (current < 1.0) {
        allCompleted = false;
        const step = deltaPercentage * (0.8 + Math.random() * 0.5);
        this.customProgress[uf] = Math.min(1.0, current + step);
      }
    });

    this.lastUpdated = new Date().toISOString();
    return !allCompleted;
  }

  getStateRecords() {
    return Object.keys(UF_DATA).map(uf => {
      const ufMeta = UF_DATA[uf];
      const rate = this.customProgress[uf] || 0.1;
      const urnasTotal = ufMeta.urnasTotal;
      const urnasApuradas = Math.round(urnasTotal * rate);
      const urnasRestantes = Math.max(0, urnasTotal - urnasApuradas);

      // Obter pesos base para esta UF
      const rawProportions = STATE_PROPORTION_OVERRIDES[uf] || REGIONAL_PROPORTIONS[ufMeta.region];
      
      // Normalizar pesos entre os candidatos ativos atuais
      let totalWeight = 0;
      this.candidates.forEach(c => {
        totalWeight += (rawProportions[c.id] || 0.02);
      });
      if (totalWeight <= 0) totalWeight = 1;

      const validVotesSoFar = Math.round(urnasApuradas * AVG_VALID_VOTES_PER_URNA);

      const candidatos = this.candidates.map(c => {
        const rawProp = rawProportions[c.id] || 0.02;
        const normalizedProp = rawProp / totalWeight;
        const votosApurados = Math.round(validVotesSoFar * normalizedProp);
        return {
          id: c.id,
          number: c.number,
          name: c.name,
          party: c.party,
          color: c.color,
          votosApurados
        };
      });

      return {
        uf: ufMeta.uf,
        name: ufMeta.name,
        region: ufMeta.region,
        urnasTotal,
        urnasApuradas,
        urnasRestantes,
        candidatos
      };
    });
  }
}

module.exports = {
  SimulationEngine,
  SCENARIOS
};
