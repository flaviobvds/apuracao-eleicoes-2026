// Mock local para validar a UI sem backend (?mock=1, ?mock=aguardando, ?mock=encerrada).
// Gera dados determinísticos no mesmo formato de GET /api/segundo-turno,
// GET /api/segundo-turno/uf/{uf} e GET /api/segundo-turno/indice.

import { UF_NOMES } from './utils';

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = hashStr(String(seed));
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// eleitorado (milhões) e % de Flávio entre os dois finalistas (base 1º turno)
const UFS = [
  ['ac', 0.6, 69], ['al', 2.3, 42], ['am', 2.7, 48], ['ap', 0.56, 49], ['ba', 11.3, 28],
  ['ce', 6.9, 31], ['df', 2.2, 58], ['es', 2.9, 58], ['go', 4.9, 58], ['ma', 5.1, 29],
  ['mg', 16.4, 49], ['ms', 2.0, 59], ['mt', 2.5, 64], ['pa', 6.1, 45], ['pb', 3.1, 34],
  ['pe', 7.1, 33], ['pi', 2.6, 24], ['pr', 8.5, 62], ['rj', 12.9, 56], ['rn', 2.6, 35],
  ['ro', 1.25, 70], ['rr', 0.38, 75], ['rs', 8.6, 56], ['sc', 5.5, 69], ['se', 1.7, 33],
  ['sp', 34.8, 55], ['to', 1.1, 49], ['zz', 0.75, 47],
];

const PRESIDENTE = [
  { numero: '22', nome: 'Flávio Bolsonaro', nomeCompleto: 'FLAVIO NANTES BOLSONARO', partido: 'PL', eleito: false },
  { numero: '13', nome: 'Lula', nomeCompleto: 'LUIZ INÁCIO LULA DA SILVA', partido: 'PT', eleito: false },
];

const GOVERNADORES = {
  ac: { base: 54, c: [['11', 'Rafael Moura', 'PP'], ['44', 'Joana Lima', 'UNIÃO']] },
  am: { base: 51, c: [['44', 'Carlos Almeida Bittencourt Filho', 'UNIÃO'], ['22', 'Beatriz Souza', 'PL']] },
  df: { base: 47, c: [['22', 'Márcia Fonseca', 'PL'], ['55', 'Eduardo Ramos', 'PSD']] },
  es: { base: 52, c: [['45', 'Ricardo Ferraz', 'PSDB'], ['11', 'Lúcia Carvalho', 'PP']] },
  rn: { base: 49.5, c: [['13', 'Fátima Andrade', 'PT'], ['10', 'Jorge Medeiros', 'REPUBLICANOS']] },
  to: { base: 56, c: [['10', 'Wanderlei Costa', 'REPUBLICANOS'], ['15', 'Paulo Rezende', 'MDB']] },
};

const CAPITAIS = {
  ac: 'RIO BRANCO', al: 'MACEIÓ', am: 'MANAUS', ap: 'MACAPÁ', ba: 'SALVADOR', ce: 'FORTALEZA',
  df: 'BRASÍLIA', es: 'VITÓRIA', go: 'GOIÂNIA', ma: 'SÃO LUÍS', mg: 'BELO HORIZONTE',
  ms: 'CAMPO GRANDE', mt: 'CUIABÁ', pa: 'BELÉM', pb: 'JOÃO PESSOA', pe: 'RECIFE', pi: 'TERESINA',
  pr: 'CURITIBA', rj: 'RIO DE JANEIRO', rn: 'NATAL', ro: 'PORTO VELHO', rr: 'BOA VISTA',
  rs: 'PORTO ALEGRE', sc: 'FLORIANÓPOLIS', se: 'ARACAJU', sp: 'SÃO PAULO', to: 'PALMAS', zz: null,
};

const EXTRAS = {
  sp: ['CAMPINAS', 'GUARULHOS', "SANTA BÁRBARA D'OESTE", 'SÃO JOSÉ DOS CAMPOS', 'RIBEIRÃO PRETO', 'SANTOS', 'SOROCABA'],
  mg: ['UBERLÂNDIA', 'CONTAGEM', 'JUIZ DE FORA', 'MONTES CLAROS', 'SÃO JOÃO DEL REI'],
  rj: ['NITERÓI', 'DUQUE DE CAXIAS', 'NOVA IGUAÇU', 'SÃO GONÇALO', 'PETRÓPOLIS'],
  zz: ['LISBOA', 'MIAMI', 'TÓQUIO', 'BUENOS AIRES', 'LONDRES', 'PARIS', 'NOVA YORK', 'BOSTON'],
};

const P1 = ['SÃO', 'SANTA', 'VILA', 'NOVA', 'BOM JESUS', 'PORTO', 'CAMPO', 'SERRA', 'LAGOA', 'BARRA', 'RIO', 'MONTE'];
const P2 = ['DO NORTE', 'DA SERRA', 'DOS CAMPOS', "D'OESTE", 'ALEGRE', 'VERDE', 'DAS FLORES', 'DO SUL', 'BONITO', 'DOURADO', 'DO PRATA', 'GRANDE'];

const munCache = {};

// Lista estática de municípios (e zonas) por UF.
function municipiosDaUf(uf) {
  if (munCache[uf]) return munCache[uf];
  const rand = rng(`mun-${uf}`);
  const qtd = uf === 'sp' ? 170 : uf === 'mg' ? 140 : uf === 'zz' ? 8 : 10 + Math.floor(rand() * 20);
  const nomes = [];
  const usados = new Set();
  if (CAPITAIS[uf]) nomes.push(CAPITAIS[uf]);
  (EXTRAS[uf] || []).forEach((n) => nomes.push(n));
  let k = 0;
  while (nomes.length < qtd && k < 2000) {
    const n = `${P1[Math.floor(rand() * P1.length)]} ${P2[Math.floor(rand() * P2.length)]}`;
    k++;
    if (usados.has(n) || nomes.includes(n)) continue;
    usados.add(n);
    nomes.push(n);
  }
  let zonaSeq = 1;
  const lista = nomes.slice(0, qtd).map((nome, i) => {
    const capital = nome === CAPITAIS[uf];
    const nz = uf === 'zz' ? 1 : capital ? (uf === 'sp' ? 12 : 5) : i < 8 ? 2 : 1;
    const zonas = [];
    if (uf === 'zz') zonas.push('0001');
    else if (!capital && i % 3 !== 1 && i > 8) {
      // municípios pequenos compartilham zona com o vizinho anterior
      zonas.push(String(zonaSeq).padStart(4, '0'));
      if (i % 3 === 2) zonaSeq++;
    } else {
      for (let z = 0; z < nz; z++) zonas.push(String(zonaSeq++).padStart(4, '0'));
    }
    const cod = String(10000 + (hashStr(`${uf}-${nome}`) % 89999));
    return {
      uf, cod, nome, capital, zonas,
      governador: Boolean(GOVERNADORES[uf]),
      peso: capital ? 30 + rand() * 20 : i < 8 ? 6 + rand() * 6 : 0.3 + rand() * 2.5,
    };
  });
  munCache[uf] = lista;
  return lista;
}

function apuradoDe(pct, rand) {
  if (pct <= 0) return 0;
  if (pct >= 100) return 100;
  const f = clamp(pct * (0.25 + rand() * 1.5), 0, 100);
  return rand() < 0.08 ? 0 : rand() < 0.1 ? 100 : f;
}

function corrida({ id, cargo, uf, nome, candidatos, eleitorado, base, swing, pct, pares, seed }) {
  const rand = rng(seed);
  const [a, b] = candidatos.map((c) => c.numero);
  const pctSecoes = pct <= 0 ? 0 : pct >= 100 ? 100 : clamp(pct * (0.6 + rand() * 0.8), 0.5, 99.5);
  const f = pctSecoes / 100;
  const pctComparecimento = 76 + rand() * 6;
  const comparecimentoTotal = eleitorado * pctComparecimento / 100;
  const validosTotal = comparecimentoTotal * 0.94;
  const real = clamp(base + swing, 2, 98);
  const viesParcial = (rand() - 0.5) * 6 * (1 - f);
  const ofPct = clamp(real + viesParcial, 1, 99);
  const vApur = validosTotal * f;
  const m1Pct = f * ofPct + (1 - f) * base;
  const m2Pct = f * ofPct + (1 - f) * (base + swing * 0.9);
  const secoesTotais = Math.round(eleitorado / 318);
  const mk = (p, total) => ({
    [a]: { votos: Math.round(total * p / 100), pct: r2(p) },
    [b]: { votos: Math.round(total * (100 - p) / 100), pct: r2(100 - p) },
  });
  const comecou = pctSecoes > 0;
  return {
    id, cargo, uf, nome,
    candidatos: candidatos.map((c) => ({ ...c })),
    apuracao: {
      pctSecoes: r2(pctSecoes),
      secoesApuradas: Math.round(secoesTotais * f),
      secoesTotais,
      eleitorado: Math.round(eleitorado),
      comparecimento: comecou ? Math.round(comparecimentoTotal * f) : 0,
      pctComparecimento: comecou ? r2(pctComparecimento) : null,
      votosValidos: Math.round(vApur),
      brancos: Math.round(comparecimentoTotal * f * 0.02),
      nulos: Math.round(comparecimentoTotal * f * 0.04),
    },
    oficial: comecou ? mk(ofPct, vApur) : null,
    metrica1: mk(comecou ? m1Pct : base, validosTotal),
    metrica1PreApuracao: { [a]: { pct: r2(base) }, [b]: { pct: r2(100 - base) } },
    metrica2: comecou ? mk(m2Pct, validosTotal) : null,
    variacaoPp: comecou ? r2(swing + (rand() - 0.5)) : null,
    pares: {
      total: pares,
      comApuracao: Math.round(pares * Math.min(1, f * 1.4)),
      completos: Math.round(pares * f * 0.8),
    },
  };
}

function somaNacional(ufs, pct) {
  const [c0, c1] = PRESIDENTE;
  const soma = (key) => {
    let x = 0;
    let y = 0;
    ufs.forEach((r) => {
      x += r[key]?.[c0.numero]?.votos || 0;
      y += r[key]?.[c1.numero]?.votos || 0;
    });
    const t = x + y;
    return t > 0 ? { [c0.numero]: { votos: x, pct: r2((x / t) * 100) }, [c1.numero]: { votos: y, pct: r2((y / t) * 100) } } : null;
  };
  const ap = ufs.reduce((acc, r) => {
    Object.entries(r.apuracao).forEach(([k, v]) => {
      if (typeof v === 'number' && !k.startsWith('pct')) acc[k] = (acc[k] || 0) + v;
    });
    return acc;
  }, {});
  const pre = (() => {
    let x = 0;
    let t = 0;
    ufs.forEach((r) => {
      const w = r.apuracao.eleitorado;
      x += (r.metrica1PreApuracao[c0.numero].pct / 100) * w;
      t += w;
    });
    const p = (x / t) * 100;
    return { [c0.numero]: { pct: r2(p) }, [c1.numero]: { pct: r2(100 - p) } };
  })();
  const comecou = pct > 0;
  return {
    id: 'presidente-br', cargo: 'presidente', uf: 'br', nome: 'Brasil',
    candidatos: PRESIDENTE.map((c) => ({ ...c })),
    apuracao: {
      ...ap,
      pctSecoes: r2((ap.secoesApuradas / ap.secoesTotais) * 100),
      pctComparecimento: comecou ? r2((ap.comparecimento / (ap.eleitorado * (ap.secoesApuradas / ap.secoesTotais))) * 100) : null,
    },
    oficial: comecou ? soma('oficial') : null,
    metrica1: soma('metrica1'),
    metrica1PreApuracao: pre,
    metrica2: comecou ? soma('metrica2') : null,
    variacaoPp: comecou ? 1.3 : null,
    pares: { total: 6292, comApuracao: ufs.reduce((s, r) => s + r.pares.comApuracao, 0), completos: ufs.reduce((s, r) => s + r.pares.completos, 0) },
  };
}

function marcarEleito(race) {
  const of = race.oficial;
  if (!of) return race;
  const [c0, c1] = race.candidatos;
  const venc = (of[c0.numero]?.pct || 0) >= (of[c1.numero]?.pct || 0) ? 0 : 1;
  race.candidatos[venc].eleito = true;
  return race;
}

export function buildMockSegundoTurno({ pct = 40, now = Date.now() } = {}) {
  const status = pct <= 0 ? 'aguardando' : pct >= 100 ? 'encerrada' : 'apurando';
  const ufs = UFS.map(([uf, mi, base], i) => corrida({
    id: `presidente-${uf}`, cargo: 'presidente', uf, nome: UF_NOMES[uf],
    candidatos: PRESIDENTE, eleitorado: mi * 1e6, base: base + 0.4, swing: 1.3 + ((i * 7) % 5 - 2) * 0.5,
    pct, pares: Math.max(4, Math.round(mi * 38)), seed: `p-${uf}`,
  }));
  const nacional = somaNacional(ufs, pct);
  const governador = Object.entries(GOVERNADORES).map(([uf, g], i) => corrida({
    id: `governador-${uf}`, cargo: 'governador', uf, nome: UF_NOMES[uf],
    candidatos: g.c.map(([numero, nome, partido]) => ({ numero, nome, nomeCompleto: nome.toUpperCase(), partido, eleito: false })),
    eleitorado: UFS.find((u) => u[0] === uf)[1] * 1e6, base: g.base, swing: (i % 2 ? -1 : 1) * (0.8 + i * 0.3),
    pct, pares: 60 + i * 15, seed: `g-${uf}`,
  }));
  if (status === 'encerrada') {
    marcarEleito(nacional);
    ufs.forEach(marcarEleito);
    governador.forEach(marcarEleito);
  }
  const inicio = status === 'aguardando' ? new Date(now + 12 * 60 * 1000) : new Date(now - 2 * 3600 * 1000);
  const d = new Date(now);
  const tse = `${d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} ${d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
  return {
    success: true,
    atualizadoEm: d.toISOString(),
    tseDataHora: tse,
    status,
    inicioApuracao: inicio.toISOString(),
    simulacao: null,
    presidente: { nacional, ufs },
    governador,
    diagnostico: { paresTotal: 6805, paresConsultados: 6805, paresPendentes: 0, duracaoMs: 812 },
  };
}

// Histórico sintético minuto a minuto desde as 17:00 de Brasília (20:00 UTC), terminando nos valores atuais da corrida.
// pctSecoes sobe; oficial começa longe e converge; M1 e M2 são mais estáveis.
export function buildMockHistorico(race, now = Date.now()) {
  const MIN = 60000;
  const pctAtual = race?.apuracao?.pctSecoes;
  const cands = Array.isArray(race?.candidatos) ? race.candidatos : [];
  if (!race?.id || !(pctAtual > 0) || cands.length < 2) return [];
  const val = (k) => {
    const v = race[k]?.[cands[0].numero]?.pct;
    return typeof v === 'number' ? v : null;
  };
  const fim = { of: val('oficial'), m1: val('metrica1'), m2: val('metrica2') };
  const d = new Date(now);
  let inicio = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 20, 0, 0);
  if (inicio > now) inicio -= 24 * 3600 * 1000;
  // fora do horário da apuração (teste de tarde, por ex.), simula as últimas 2 h
  if (now - inicio < 30 * MIN || now - inicio > 10 * 3600 * 1000) inicio = now - 120 * MIN;
  const total = Math.max(2, Math.floor((now - inicio) / MIN));
  const rand = rng(`hist-${race.id}`);
  const norm = (x, k) => (Math.exp(-k * x) - Math.exp(-k)) / (1 - Math.exp(-k));
  const K_OF = 1.5;
  // Corridas apertadas (|oficial - 50| <= 6) ganham uma virada no meio da curva: o oficial começa do
  // outro lado de 50% e cruza em f = 0,5, sem ruído perto do cruzamento (uma virada só).
  const forcarVirada = fim.of != null && Math.abs(fim.of - 50) <= 6 && Math.abs(fim.of - 50) > 0.05;
  const offOf = forcarVirada
    ? (50 - fim.of) / norm(0.5, K_OF)
    : (rand() < 0.5 ? -1 : 1) * (3 + rand() * 5);
  const offM = (rand() - 0.5) * 2.5;
  const pts = [];
  for (let i = 0; i < total; i++) {
    const f = (i + 1) / total;
    const pct = pctAtual * (1 - Math.exp(-2.5 * f)) / (1 - Math.exp(-2.5));
    const decai = norm(f, 4);
    const ruido = () => (rand() - 0.5);
    // ruído nunca maior que a distância da tendência até 50%: só a tendência produz virada
    const comRuido = (tend, amp) => tend + ruido() * amp * Math.min(1, Math.abs(tend - 50) / 1.5);
    const of = fim.of != null ? clamp(comRuido(fim.of + offOf * norm(f, K_OF), 1.0 * (1 - f)), 1, 99) : null;
    const m1 = fim.m1 != null ? clamp(comRuido(fim.m1 + offM * 0.4 * decai, 0.15), 1, 99) : null;
    const m2 = fim.m2 != null ? clamp(comRuido(fim.m2 + offM * decai, 0.3 * (1 - f)), 1, 99) : null;
    pts.push([inicio + i * MIN, r2(Math.min(pct, pctAtual)), of != null ? r2(of) : null, m1 != null ? r2(m1) : null, m2 != null ? r2(m2) : null]);
  }
  return pts;
}

export function buildMockIndice() {
  const ufs = UFS.map(([uf]) => ({ uf, nome: UF_NOMES[uf] }));
  const municipios = UFS.flatMap(([uf]) => municipiosDaUf(uf).map((m) => ({
    uf: m.uf, cod: m.cod, nome: m.nome, capital: m.capital, zonas: m.zonas, governador: m.governador,
  })));
  return { success: true, ufs, municipios };
}

export function buildMockUfDetalhe(uf, cargo, pct = 40, race = null) {
  const lista = municipiosDaUf(uf);
  const ufRow = UFS.find((u) => u[0] === uf);
  const candidatos = race?.candidatos || PRESIDENTE;
  const [a, b] = candidatos.map((c) => c.numero);
  const baseUf = cargo === 'governador' ? (GOVERNADORES[uf]?.base ?? 50) : (ufRow?.[2] ?? 50);
  const totalEleit = (ufRow?.[1] || 1) * 1e6;
  const somaPeso = lista.reduce((s, m) => s + m.peso, 0);
  const pares = [];
  lista.forEach((m) => {
    const rand = rng(`par-${cargo}-${uf}-${m.cod}`);
    const eleitMun = (m.peso / somaPeso) * totalEleit;
    m.zonas.forEach((zona) => {
      const eleitorado = Math.round(eleitMun / m.zonas.length);
      const p1 = clamp(baseUf + (rand() - 0.5) * 24, 3, 97);
      const validos1 = eleitorado * 0.74;
      const pctApurado = apuradoDe(pct, rand);
      const p2 = clamp(p1 + 1.3 + (rand() - 0.5) * 6, 2, 98);
      const v2 = validos1 * (pctApurado / 100) * 1.01;
      const t2 = pctApurado > 0 ? { [a]: Math.round(v2 * p2 / 100), [b]: Math.round(v2 * (100 - p2) / 100), pct: r2(p2) } : null;
      pares.push({
        id: `${m.cod}-${zona}`, codMunicipio: m.cod, municipio: m.nome, zona, capital: m.capital,
        eleitorado, pctApurado: r2(pctApurado),
        t1: { [a]: Math.round(validos1 * p1 / 100), [b]: Math.round(validos1 * (100 - p1) / 100), pct: r2(p1) },
        t2,
        difPp: t2 ? r2(t2.pct - p1) : null,
      });
    });
  });
  const municipios = lista.map((m) => {
    const ps = pares.filter((p) => p.codMunicipio === m.cod);
    const eleitorado = ps.reduce((s, p) => s + p.eleitorado, 0);
    const sum = (key, n) => ps.reduce((s, p) => s + (p[key]?.[n] || 0), 0);
    const t1a = sum('t1', a);
    const t1b = sum('t1', b);
    const t2a = sum('t2', a);
    const t2b = sum('t2', b);
    const t1pct = t1a + t1b > 0 ? r2((t1a / (t1a + t1b)) * 100) : null;
    const t2 = t2a + t2b > 0 ? { [a]: t2a, [b]: t2b, pct: r2((t2a / (t2a + t2b)) * 100) } : null;
    return {
      id: m.cod, codMunicipio: m.cod, municipio: m.nome, zona: null, capital: m.capital, eleitorado,
      pctApurado: r2(ps.reduce((s, p) => s + p.pctApurado * p.eleitorado, 0) / Math.max(1, eleitorado)),
      t1: { [a]: t1a, [b]: t1b, pct: t1pct },
      t2,
      difPp: t2 && t1pct != null ? r2(t2.pct - t1pct) : null,
    };
  });
  return {
    success: true,
    atualizadoEm: new Date().toISOString(),
    uf, cargo, nome: UF_NOMES[uf],
    candidatos,
    municipios,
    pares,
  };
}
