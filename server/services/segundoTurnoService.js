/**
 * Serviço do 2º turno 2026: lê na API de divulgação do TSE o parcial de cada par município × zona
 * (presidente e governador nas 6 UFs com 2º turno) e monta as projeções das métricas 1 e 2.
 *
 * Atualização incremental: os arquivos de abrangência por UF (<uf>-e<eleicao>-ab.json) dizem quantas
 * seções cada município já totalizou; só os pares de municípios que mudaram são buscados de novo.
 * O estado fica em memória (servidor local ou instância quente da Vercel) e cada atualização respeita
 * um prazo, para caber no tempo máximo da função serverless.
 */

const { calibrar, projetar } = require('./segundoTurnoProjecao');
const { gravarSnapshot } = require('./historicoStore');
const { CANDIDATE_METADATA } = require('./tseService');
const T1_PRESIDENTE = require('../data/segundoTurno/primeiroTurnoPresidente.json');
const T1_GOVERNADOR = require('../data/segundoTurno/primeiroTurnoGovernador.json');

const BASE = 'https://resultados.tse.jus.br/oficial/ele2026';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TSE-Apuracao-2026/1.0';
const INICIO_APURACAO = '2026-10-25T20:00:00.000Z'; // 17h de Brasília
// Acima de ~100 conexões simultâneas o TSE responde 429 para o IP inteiro (testado da Vercel em 25/10)
const CONCORRENCIA = 32;
const ESPERA_APOS_429_MS = 30000;
const MAX_PARES_POR_CICLO = 3000;
const PRAZO_ATUALIZACAO_MS = 35000;
const VALIDADE_SNAPSHOT_MS = 20000;
const VALIDADE_UF_MS = 60000;

const NOMES_UF = {
  ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal',
  es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul',
  mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí',
  rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima',
  sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins', zz: 'Exterior'
};

// Finalistas de cada corrida, na ordem exibida (candidato 0, candidato 1)
const CANDIDATOS_GOVERNADOR = {
  ac: ['11', '10'], am: ['55', '22'], df: ['11', '13'], es: ['10', '15'], rn: ['13', '44'], to: ['45', '44']
};

// Nome de urna e partido de reserva (usados quando o arquivo oficial da UF ainda não foi lido, ex.: simulação)
const RESERVA_GOVERNADOR = {
  ac: { 11: ['MAILZA ASSIS', 'PP'], 10: ['ALAN RICK', 'REPUBLICANOS'] },
  am: { 55: ['OMAR AZIZ', 'PSD'], 22: ['PROFESSORA MARIA DO CARMO', 'PL'] },
  df: { 11: ['CELINA LEÃO', 'PP'], 13: ['LEANDRO GRASS', 'PT'] },
  es: { 10: ['LORENZO PAZOLINI', 'REPUBLICANOS'], 15: ['RICARDO FERRAÇO', 'MDB'] },
  rn: { 13: ['CADU DE LULA', 'PT'], 44: ['ALLYSON', 'UNIÃO'] },
  to: { 45: ['VICENTINHO JÚNIOR', 'PSDB'], 44: ['PROFESSORA DORINHA', 'UNIÃO'] }
};

const int = v => parseInt(v || '0', 10) || 0;
const num = v => parseFloat(String(v || '0').replace(',', '.')) || 0;
const arred = (x, casas = 2) => Math.round(x * 10 ** casas) / 10 ** casas;

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
function nomeProprio(s) {
  return String(s || '').toLowerCase().split(' ').map((p, i) => {
    if (i > 0 && MINUSCULAS.has(p)) return p;
    if (p.startsWith("d'")) return "d'" + p.charAt(2).toUpperCase() + p.slice(3);
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
}

// ---------------------------------------------------------------------------
// Corridas e índices do 1º turno
// ---------------------------------------------------------------------------

function montarCorrida(id, cargo, eleicao, codCargo, t1, ufs, numeros) {
  const pares = [];
  const paresPorMun = {};
  for (const [key, p] of Object.entries(t1.pares)) {
    if (!ufs.includes(p.uf)) continue;
    const par = { key, uf: p.uf, mun: p.mun, z: p.z, t1: p };
    pares.push(par);
    (paresPorMun[p.uf + p.mun] ||= []).push(par);
  }
  return {
    id, cargo, eleicao, codCargo, ufs, numeros, pares, paresPorMun,
    municipios: t1.municipios,
    vivo: { t2: new Map(), munSt: new Map(), lidoEm: new Map(), oficial: {}, atualizadoUf: {} }
  };
}

const UFS_PRESIDENTE = [...new Set(Object.values(T1_PRESIDENTE.pares).map(p => p.uf))];
const PRESIDENTE = montarCorrida('presidente', 'presidente', process.env.ST_ELEICAO_PRESIDENTE || '6258', 'c0001', T1_PRESIDENTE, UFS_PRESIDENTE, ['22', '13']);
const GOVERNADORES = Object.fromEntries(Object.entries(CANDIDATOS_GOVERNADOR).map(([uf, numeros]) =>
  [uf, montarCorrida(`governador-${uf}`, 'governador', process.env.ST_ELEICAO_GOVERNADOR || '6260', 'c0003', T1_GOVERNADOR, [uf], numeros)]));
const TODAS = [PRESIDENTE, ...Object.values(GOVERNADORES)];

// ---------------------------------------------------------------------------
// Acesso à API do TSE
// ---------------------------------------------------------------------------

let ativos = 0;
const fila = [];
async function comVaga(fn) {
  if (ativos >= CONCORRENCIA) await new Promise(res => fila.push(res));
  ativos++;
  try {
    return await fn();
  } finally {
    ativos--;
    const proximo = fila.shift();
    if (proximo) proximo();
  }
}

const PULADO = Symbol('pulado');
let bloqueadoAte = 0;

/** Busca um JSON do TSE (null em 404). Com `prazo`, devolve PULADO se a vaga só abrir depois dele. */
async function getJson(url, prazo) {
  return comVaga(async () => {
    // Pares são opcionais num ciclo: depois de um 429 do TSE, ficam para o próximo ciclo
    if (prazo && (Date.now() > prazo || Date.now() < bloqueadoAte)) return PULADO;
    let erro;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
        if (r.status === 404) return null;
        if (r.status === 429) {
          bloqueadoAte = Date.now() + ESPERA_APOS_429_MS;
          throw new Error('HTTP 429');
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      } catch (e) {
        erro = e;
      }
    }
    throw new Error(`${url}: ${erro.message}`);
  });
}

function lerOficial(j) {
  if (!j || !j.s) return null;
  const cands = {};
  for (const agr of (j.carg && j.carg[0] && j.carg[0].agr) || []) {
    for (const p of agr.par) {
      for (const c of p.cand) {
        cands[c.n] = {
          votos: int(c.vap),
          nomeUrna: c.nmu,
          nomeCompleto: c.nm,
          partido: p.sg,
          eleito: /^eleito/i.test(c.st || '')
        };
      }
    }
  }
  return {
    dataHora: j.dg && j.hg ? `${j.dg} ${j.hg}` : null,
    apuracao: {
      pctSecoes: num(j.s.pst),
      secoesApuradas: int(j.s.st),
      secoesTotais: int(j.s.ts),
      eleitorado: int(j.e && j.e.te),
      eleitoradoApurado: int(j.e && j.e.est),
      comparecimento: int(j.e && j.e.c),
      pctComparecimento: num(j.e && j.e.pc),
      votosValidos: int(j.v && j.v.vv),
      brancos: int(j.v && j.v.vb),
      nulos: int(j.v && j.v.tvn)
    },
    cands
  };
}

function lerPar(j) {
  const votos = {};
  for (const agr of (j.carg && j.carg[0] && j.carg[0].agr) || []) {
    for (const p of agr.par) for (const c of p.cand) votos[c.n] = int(c.vap);
  }
  return { votos, te: int(j.e.te), est: int(j.e.est), st: int(j.s.st), ts: int(j.s.ts), c: int(j.e.c) };
}

const urlDados = (c, uf, arquivo) => `${BASE}/${c.eleicao}/dados/${uf}/${arquivo}`;

const emAndamento = new Map();
function unico(chave, fn) {
  if (!emAndamento.has(chave)) {
    emAndamento.set(chave, fn().finally(() => emAndamento.delete(chave)));
  }
  return emAndamento.get(chave);
}

/** Lê o arquivo oficial e a abrangência de uma UF e devolve os municípios cujo nº de seções totalizadas mudou. */
async function lerAbrangencia(corrida, uf) {
  const vivo = corrida.vivo;
  const [oficial, ab] = await Promise.all([
    getJson(urlDados(corrida, uf, `${uf}-${corrida.codCargo}-e00${corrida.eleicao}-u.json`)).catch(() => null),
    getJson(urlDados(corrida, uf, `${uf}-e00${corrida.eleicao}-ab.json`)).catch(() => null)
  ]);
  if (oficial) vivo.oficial[uf] = lerOficial(oficial);
  if (!ab || !ab.abr) return [];

  const tarefas = [];
  for (const m of ab.abr) {
    if (m.tpabr !== 'mun') continue;
    const chaveMun = uf + m.cdabr;
    const st = int(m.s && m.s.st);
    if (st === 0 || vivo.munSt.get(chaveMun) === st) continue;
    tarefas.push({ corrida, uf, chaveMun, st, pares: corrida.paresPorMun[chaveMun] || [] });
  }
  return tarefas;
}

/**
 * Busca os pares dos municípios informados, do lido há mais tempo para o mais recente, até o prazo.
 * Um município só é marcado como lido quando todos os seus pares vieram; senão volta no próximo ciclo.
 */
async function buscarPares(tarefas, prazo, diag, limite = Infinity) {
  tarefas.sort((a, b) => (a.corrida.vivo.lidoEm.get(a.chaveMun) || 0) - (b.corrida.vivo.lidoEm.get(b.chaveMun) || 0));
  let soma = 0;
  const desteCiclo = tarefas.filter(t => (soma += t.pares.length) <= limite || soma === t.pares.length);
  diag.pendentes += tarefas.slice(desteCiclo.length).reduce((s, t) => s + t.pares.length, 0);
  await Promise.all(desteCiclo.map(async t => {
    const { corrida, uf } = t;
    const lidos = await Promise.all(t.pares.map(par =>
      getJson(urlDados(corrida, uf, `${uf}${par.mun}-z${par.z}-${corrida.codCargo}-e00${corrida.eleicao}-u.json`), prazo)
        .then(j => (j === PULADO ? null : (diag.consultados++, j ? { par, dado: lerPar(j) } : null)))
        .catch(() => null)));
    let completo = true;
    let stPares = 0;
    for (const l of lidos) {
      if (l) {
        corrida.vivo.t2.set(l.par.key, l.dado);
        stPares += l.dado.st;
      } else {
        completo = false;
      }
    }
    // Os arquivos por zona podem sair depois da abrangência: só marca como lido quando as zonas já somam as seções do município
    if (completo && stPares < t.st) {
      completo = false;
      diag.atrasados = (diag.atrasados || 0) + 1;
    }
    if (completo) {
      corrida.vivo.munSt.set(t.chaveMun, t.st);
      corrida.vivo.lidoEm.set(t.chaveMun, Date.now());
    } else {
      diag.pendentes += lidos.filter(l => !l).length;
    }
  }));
}

/** Atualiza só uma UF de uma corrida (detalhe da UF). */
function atualizarUf(corrida, uf, prazo, diag) {
  return unico(`${corrida.id}:${uf}`, async () => {
    await buscarPares(await lerAbrangencia(corrida, uf), prazo, diag);
    corrida.vivo.atualizadoUf[uf] = Date.now();
  });
}

async function atualizarTudo() {
  const inicio = Date.now();
  const prazo = inicio + PRAZO_ATUALIZACAO_MS;
  const diag = { consultados: 0, pendentes: 0 };
  const br = getJson(urlDados(PRESIDENTE, 'br', `br-c0001-e00${PRESIDENTE.eleicao}-u.json`))
    .then(j => { if (j) PRESIDENTE.vivo.oficial.br = lerOficial(j); })
    .catch(() => {});
  const listas = await Promise.all(TODAS.flatMap(c => c.ufs.map(uf => lerAbrangencia(c, uf).catch(() => []))));
  await buscarPares(listas.flat(), prazo, diag, MAX_PARES_POR_CICLO);
  await br;
  const agora = Date.now();
  for (const c of TODAS) for (const uf of c.ufs) c.vivo.atualizadoUf[uf] = agora;
  return { ...diag, duracaoMs: agora - inicio };
}

// ---------------------------------------------------------------------------
// Simulação (para testar a página antes/fora da apuração): gera parciais sintéticos a partir do 1º turno
// ---------------------------------------------------------------------------

function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

const cacheSimulacao = new Map();
function estadoSimulado(pctAlvo) {
  if (cacheSimulacao.has(pctAlvo)) return cacheSimulacao.get(pctAlvo);
  const T = pctAlvo / 100;
  const estados = {};
  for (const corrida of TODAS) {
    const t2 = new Map();
    const [n0, n1] = corrida.numeros;
    for (const par of corrida.pares) {
      const p = par.t1;
      const u = hash01(par.key + corrida.id);
      const f = T >= 1 ? 1 : T <= 0 ? 0 : Math.min(1, Math.max(0, (T - u) / 0.3 + 0.5));
      const a1 = p.cand[n0] || 0;
      const b1 = p.cand[n1] || 0;
      const s1 = a1 + b1 ? a1 / (a1 + b1) : 0.5;
      const desvio = 0.08 + (hash01(par.uf + corrida.id + 's') - 0.5) * 0.3 + (hash01(par.key + 'n') - 0.5) * 0.2;
      const lg = Math.log(Math.min(0.999, Math.max(0.001, s1)) / (1 - Math.min(0.999, Math.max(0.001, s1))));
      const o = 1 / (1 + Math.exp(-(lg + desvio)));
      const est = Math.round(p.te * f);
      const validos = Math.round(est * (p.te ? p.vv / p.te : 0) * 0.95);
      const a = Math.round(validos * o);
      t2.set(par.key, {
        votos: { [n0]: a, [n1]: validos - a },
        te: p.te, est, st: Math.round(p.ts * f), ts: p.ts,
        c: Math.round(est * (p.te ? p.c / p.te : 0))
      });
    }
    estados[corrida.id] = { t2, oficial: oficialDosPares(corrida, t2) };
  }
  cacheSimulacao.set(pctAlvo, estados);
  return estados;
}

function oficialDosPares(corrida, t2) {
  const porEscopo = {};
  for (const par of corrida.pares) {
    const d = t2.get(par.key);
    if (!d) continue;
    for (const esc of corrida.cargo === 'presidente' ? ['br', par.uf] : [par.uf]) {
      const o = (porEscopo[esc] ||= { st: 0, ts: 0, te: 0, est: 0, c: 0, votos: {} });
      o.st += d.st; o.ts += d.ts; o.te += d.te; o.est += d.est; o.c += d.c;
      for (const [n, v] of Object.entries(d.votos)) o.votos[n] = (o.votos[n] || 0) + v;
    }
  }
  const saida = {};
  for (const [esc, o] of Object.entries(porEscopo)) {
    const vv = Object.values(o.votos).reduce((x, y) => x + y, 0);
    saida[esc] = {
      dataHora: null,
      apuracao: {
        pctSecoes: o.ts ? arred((o.st / o.ts) * 100) : 0,
        secoesApuradas: o.st, secoesTotais: o.ts, eleitorado: o.te, eleitoradoApurado: o.est, comparecimento: o.c,
        pctComparecimento: o.est ? arred((o.c / o.est) * 100) : 0,
        votosValidos: vv, brancos: Math.round((o.c - vv) * 0.4), nulos: Math.round((o.c - vv) * 0.6)
      },
      cands: Object.fromEntries(Object.entries(o.votos).map(([n, v]) => [n, { votos: v, eleito: false }]))
    };
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Montagem das respostas
// ---------------------------------------------------------------------------

function paresParaProjecao(corrida, t2, filtroUf) {
  const [n0, n1] = corrida.numeros;
  const lista = [];
  for (const par of corrida.pares) {
    if (filtroUf && par.uf !== filtroUf) continue;
    const p = par.t1;
    const d = t2.get(par.key);
    lista.push({
      key: par.key,
      uf: par.uf,
      t1: { a: p.cand[n0] || 0, b: p.cand[n1] || 0, vv: p.vv, te: p.te, ts: p.ts },
      t2: d ? { a: d.votos[n0] || 0, b: d.votos[n1] || 0, te: d.te, est: d.est, st: d.st, ts: d.ts } : null
    });
  }
  return lista;
}

function infoCandidatos(corrida, oficial) {
  const vivo = corrida.vivo.oficial[corrida.cargo === 'presidente' ? 'br' : corrida.ufs[0]];
  return corrida.numeros.map(n => {
    const c = { ...((vivo && vivo.cands[n]) || {}), ...((oficial && oficial.cands[n]) || {}) };
    const meta = corrida.cargo === 'presidente' ? CANDIDATE_METADATA[n] : null;
    const reserva = (RESERVA_GOVERNADOR[corrida.ufs[0]] || {})[n] || [];
    return {
      numero: n,
      nome: meta ? meta.shortName : nomeProprio(c.nomeUrna || reserva[0] || `Candidato ${n}`),
      nomeCompleto: c.nomeCompleto || null,
      partido: meta ? meta.party : c.partido || reserva[1] || null,
      eleito: !!c.eleito
    };
  });
}

function paraPct(a, b, n0, n1, comVotos = true) {
  const tot = a + b;
  const pct = x => (tot > 0 ? arred((x / tot) * 100) : null);
  return comVotos
    ? { [n0]: { votos: Math.round(a), pct: pct(a) }, [n1]: { votos: Math.round(b), pct: pct(b) } }
    : { [n0]: { pct: pct(a) }, [n1]: { pct: pct(b) } };
}

function corridaJson(corrida, estado, cal, escopo) {
  const [n0, n1] = corrida.numeros;
  const pares = paresParaProjecao(corrida, estado.t2, escopo === 'br' ? null : escopo);
  const r = projetar(pares, cal);
  const oficial = estado.oficial[escopo] || null;
  const apuracao = oficial ? oficial.apuracao : {
    pctSecoes: 0, secoesApuradas: 0, secoesTotais: 0, eleitorado: 0, eleitoradoApurado: 0, comparecimento: 0,
    pctComparecimento: 0, votosValidos: 0, brancos: 0, nulos: 0
  };
  const oa = oficial && oficial.cands[n0] ? oficial.cands[n0].votos : r.obs.a;
  const ob = oficial && oficial.cands[n1] ? oficial.cands[n1].votos : r.obs.b;
  const vObs = r.obs.a + r.obs.b;
  // 1º turno dos dois finalistas no escopo: % entre os dois e % sobre todos os votos válidos
  const t1 = pares.reduce((s, p) => ({ a: s.a + p.t1.a, b: s.b + p.t1.b, vv: s.vv + p.t1.vv }), { a: 0, b: 0, vv: 0 });
  const primeiroTurno = paraPct(t1.a, t1.b, n0, n1);
  if (t1.vv > 0) {
    primeiroTurno[n0].pctValidos = arred((t1.a / t1.vv) * 100);
    primeiroTurno[n1].pctValidos = arred((t1.b / t1.vv) * 100);
  }
  return {
    id: `${corrida.cargo}-${escopo}`,
    cargo: corrida.cargo,
    uf: escopo,
    nome: escopo === 'br' ? 'Brasil' : NOMES_UF[escopo],
    candidatos: infoCandidatos(corrida, oficial || estado.oficial.br),
    apuracao,
    oficial: paraPct(oa, ob, n0, n1),
    metrica1: paraPct(r.m1.a, r.m1.b, n0, n1),
    metrica1PreApuracao: paraPct(r.pre.a, r.pre.b, n0, n1, false),
    metrica2: paraPct(r.m2.a, r.m2.b, n0, n1),
    primeiroTurno,
    variacaoPp: vObs > 0 ? arred(((r.obs.a - r.obs.s1w) / vObs) * 100) : null,
    pares: { total: pares.length, comApuracao: r.comApuracao, completos: r.completos }
  };
}

function estadoDe(corrida, simulado) {
  return simulado ? simulado[corrida.id] : corrida.vivo;
}

function montarSnapshot(simulado, pctAlvo, diag) {
  const calPres = calibrar(paresParaProjecao(PRESIDENTE, estadoDe(PRESIDENTE, simulado).t2));
  const estPres = estadoDe(PRESIDENTE, simulado);
  const nacional = corridaJson(PRESIDENTE, estPres, calPres, 'br');
  const ufs = UFS_PRESIDENTE.map(uf => corridaJson(PRESIDENTE, estPres, calPres, uf))
    .sort((a, b) => (a.uf === 'zz') - (b.uf === 'zz') || a.nome.localeCompare(b.nome, 'pt-BR'));
  const governador = Object.values(GOVERNADORES).map(g => {
    const est = estadoDe(g, simulado);
    return corridaJson(g, est, calibrar(paresParaProjecao(g, est.t2)), g.ufs[0]);
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const ap = nacional.apuracao;
  const status = ap.secoesApuradas === 0 ? 'aguardando'
    : ap.secoesTotais > 0 && ap.secoesApuradas >= ap.secoesTotais ? 'encerrada' : 'apurando';
  const oficialBr = estPres.oficial.br;
  return {
    success: true,
    atualizadoEm: new Date().toISOString(),
    tseDataHora: oficialBr ? oficialBr.dataHora : null,
    status,
    inicioApuracao: INICIO_APURACAO,
    simulacao: simulado ? { pctAlvo } : null,
    presidente: { nacional, ufs },
    governador,
    diagnostico: {
      paresTotal: TODAS.reduce((s, c) => s + c.pares.length, 0),
      paresConsultados: diag ? diag.consultados : 0,
      paresPendentes: diag ? diag.pendentes : 0,
      municipiosAtrasados: diag ? diag.atrasados || 0 : 0,
      duracaoMs: diag ? diag.duracaoMs : 0
    }
  };
}

let ultimoSnapshot = null;
let ultimoSnapshotEm = 0;

function lerSimulacao(simular) {
  if (simular === undefined || simular === null || simular === '') return null;
  const v = Math.round(Number(simular));
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null;
}

async function obterSnapshot({ simular } = {}) {
  const pct = lerSimulacao(simular);
  if (pct !== null) return montarSnapshot(estadoSimulado(pct), pct, null);

  if (ultimoSnapshot && Date.now() - ultimoSnapshotEm < VALIDADE_SNAPSHOT_MS) return ultimoSnapshot;
  // Atualização longa já em curso: quem chega agora recebe o último snapshot em vez de esperar
  if (ultimoSnapshot && emAndamento.has('snapshot')) return ultimoSnapshot;
  return unico('snapshot', async () => {
    const diag = await atualizarTudo();
    ultimoSnapshot = montarSnapshot(null, null, diag);
    ultimoSnapshotEm = Date.now();
    await gravarSnapshot(ultimoSnapshot);
    return ultimoSnapshot;
  });
}

async function obterDetalheUf(uf, cargo, { simular } = {}) {
  uf = String(uf || '').toLowerCase();
  const corrida = cargo === 'governador' ? GOVERNADORES[uf] : PRESIDENTE;
  if (!corrida || !corrida.ufs.includes(uf)) return null;

  const pct = lerSimulacao(simular);
  let estado;
  if (pct !== null) {
    estado = estadoSimulado(pct)[corrida.id];
  } else {
    if (!(Date.now() - (corrida.vivo.atualizadoUf[uf] || 0) < VALIDADE_UF_MS)) {
      await atualizarUf(corrida, uf, Date.now() + 25000, { consultados: 0, pendentes: 0 });
    }
    estado = corrida.vivo;
  }

  const [n0, n1] = corrida.numeros;
  const linha = (id, mun, zona, a1, b1, d) => {
    const t1Tot = a1.a + a1.b;
    const t2Tot = d ? d.a + d.b : 0;
    const p1 = t1Tot ? arred((a1.a / t1Tot) * 100) : null;
    const p2 = t2Tot ? arred((d.a / t2Tot) * 100) : null;
    const info = corrida.municipios[uf + mun] || {};
    return {
      id, codMunicipio: mun, municipio: info.nm || mun, zona, capital: !!info.cap,
      eleitorado: b1.te,
      pctApurado: b1.te ? arred(((d ? d.est : 0) / b1.te) * 100) : 0,
      t1: { [n0]: a1.a, [n1]: a1.b, pct: p1 },
      t2: t2Tot ? { [n0]: d.a, [n1]: d.b, pct: p2 } : null,
      difPp: p1 !== null && p2 !== null ? arred(p2 - p1) : null
    };
  };

  const pares = [];
  const porMun = {};
  for (const par of corrida.pares) {
    if (par.uf !== uf) continue;
    const p = par.t1;
    const raw = estado.t2.get(par.key);
    const a1 = { a: p.cand[n0] || 0, b: p.cand[n1] || 0 };
    const d = raw ? { a: raw.votos[n0] || 0, b: raw.votos[n1] || 0, est: raw.est } : null;
    pares.push(linha(`${par.mun}-${par.z}`, par.mun, par.z, a1, { te: raw ? raw.te || p.te : p.te }, d));

    const m = (porMun[par.mun] ||= { a1: { a: 0, b: 0 }, te: 0, d: { a: 0, b: 0, est: 0 }, temD: false });
    m.a1.a += a1.a; m.a1.b += a1.b;
    m.te += raw ? raw.te || p.te : p.te;
    if (d) { m.d.a += d.a; m.d.b += d.b; m.d.est += d.est; m.temD = true; }
  }
  const municipios = Object.entries(porMun).map(([mun, m]) =>
    linha(mun, mun, null, m.a1, { te: m.te }, m.temD ? m.d : null));

  const oficial = estado.oficial[uf] || (corrida.cargo === 'presidente' ? estado.oficial.br : null);
  return {
    success: true,
    atualizadoEm: new Date().toISOString(),
    uf,
    cargo: corrida.cargo,
    nome: NOMES_UF[uf],
    candidatos: infoCandidatos(corrida, oficial),
    municipios,
    pares
  };
}

let indiceCache = null;
function obterIndice() {
  if (indiceCache) return indiceCache;
  const zonas = {};
  for (const p of Object.values(T1_PRESIDENTE.pares)) (zonas[p.uf + p.mun] ||= []).push(p.z);
  const municipios = Object.entries(T1_PRESIDENTE.municipios).map(([chave, m]) => {
    const uf = chave.slice(0, 2);
    return {
      uf, cod: chave.slice(2), nome: m.nm, capital: !!m.cap,
      zonas: (zonas[chave] || []).sort(),
      governador: !!GOVERNADORES[uf]
    };
  });
  indiceCache = {
    success: true,
    ufs: UFS_PRESIDENTE.map(uf => ({ uf, nome: NOMES_UF[uf] }))
      .sort((a, b) => (a.uf === 'zz') - (b.uf === 'zz') || a.nome.localeCompare(b.nome, 'pt-BR')),
    municipios
  };
  return indiceCache;
}

module.exports = { obterSnapshot, obterDetalheUf, obterIndice, lerSimulacao };
