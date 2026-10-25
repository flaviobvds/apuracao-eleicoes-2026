/**
 * Baixa os resultados do 1º turno de 2026 por par município × zona (API de divulgação do TSE)
 * e grava um resumo compacto em server/data/segundoTurno/, usado como base das projeções do 2º turno.
 *
 * Uso: node server/scripts/baixarPrimeiroTurno.js
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://resultados.tse.jus.br/oficial/ele2026';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TSE-Apuracao-2026/1.0';
const OUT_DIR = path.join(__dirname, '..', 'data', 'segundoTurno');
const UFS_GOVERNADOR_2T = ['ac', 'am', 'df', 'es', 'rn', 'to'];

const ALVOS = [
  { arquivo: 'primeiroTurnoPresidente.json', eleicao: '6257', cargo: 'c0001', ufs: null },
  { arquivo: 'primeiroTurnoGovernador.json', eleicao: '6259', cargo: 'c0003', ufs: UFS_GOVERNADOR_2T }
];

async function getJson(url) {
  let ultimoErro;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      ultimoErro = e;
      await new Promise(res => setTimeout(res, 500 * (tentativa + 1)));
    }
  }
  throw new Error(`${url}: ${ultimoErro.message}`);
}

async function emLotes(itens, concorrencia, fn) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  await Promise.all(Array.from({ length: concorrencia }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i], i);
    }
  }));
  return resultados;
}

const int = v => parseInt(v || '0', 10);

function resumirPar(j, par) {
  const cand = {};
  for (const agr of j.carg[0].agr || []) {
    for (const p of agr.par) for (const c of p.cand) cand[c.n] = int(c.vap);
  }
  return {
    uf: par.uf,
    mun: par.mun,
    z: par.z,
    ts: int(j.s.ts),       // seções
    st: int(j.s.st),       // seções totalizadas
    te: int(j.e.te),       // eleitorado apto
    c: int(j.e.c),         // comparecimento
    vv: int(j.v.vv),       // votos válidos
    vb: int(j.v.vb),       // brancos
    vn: int(j.v.tvn),      // nulos
    cand
  };
}

async function baixar(alvo) {
  const cfg = await getJson(`${BASE}/${alvo.eleicao}/config/mun-e00${alvo.eleicao}-cm.json`);
  const pares = [];
  const municipios = {};
  for (const u of cfg.abr) {
    if (alvo.ufs && !alvo.ufs.includes(u.cd)) continue;
    for (const m of u.mu) {
      municipios[u.cd + m.cd] = { nm: m.nm, cap: m.c === 's', ibge: m.cdi };
      for (const z of m.z) pares.push({ uf: u.cd, mun: m.cd, z });
    }
  }

  let feitos = 0;
  const falhas = [];
  const resumos = await emLotes(pares, 24, async par => {
    const url = `${BASE}/${alvo.eleicao}/dados/${par.uf}/${par.uf}${par.mun}-z${par.z}-${alvo.cargo}-e00${alvo.eleicao}-u.json`;
    try {
      return resumirPar(await getJson(url), par);
    } catch (e) {
      falhas.push(e.message);
      return null;
    } finally {
      if (++feitos % 500 === 0) console.log(`  ${alvo.arquivo}: ${feitos}/${pares.length}`);
    }
  });

  if (falhas.length) throw new Error(`${falhas.length} pares falharam, ex.: ${falhas.slice(0, 3).join('; ')}`);

  const saida = {
    geradoEm: new Date().toISOString(),
    eleicao: alvo.eleicao,
    cargo: alvo.cargo,
    fonte: `${BASE}/${alvo.eleicao}/dados/<uf>/<uf><mun>-z<zona>-${alvo.cargo}-e00${alvo.eleicao}-u.json`,
    municipios,
    pares: Object.fromEntries(resumos.map(r => [`${r.uf}${r.mun}-${r.z}`, r]))
  };
  fs.writeFileSync(path.join(OUT_DIR, alvo.arquivo), JSON.stringify(saida));
  return saida;
}

async function conferir(saida, urlTotal) {
  const total = await getJson(urlTotal);
  const oficial = {};
  for (const agr of total.carg[0].agr) for (const p of agr.par) for (const c of p.cand) oficial[c.n] = int(c.vap);
  const somado = {};
  for (const par of Object.values(saida.pares)) for (const [n, v] of Object.entries(par.cand)) somado[n] = (somado[n] || 0) + v;
  const divergentes = Object.keys(oficial).filter(n => oficial[n] !== somado[n]);
  return { divergentes: divergentes.map(n => `${n}: oficial ${oficial[n]} × somado ${somado[n]}`) };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pres = await baixar(ALVOS[0]);
  const cp = await conferir(pres, `${BASE}/6257/dados/br/br-c0001-e006257-u.json`);
  console.log(`Presidente: ${Object.keys(pres.pares).length} pares, ${Object.keys(pres.municipios).length} municípios. Divergências vs BR:`, cp.divergentes.length ? cp.divergentes : 'nenhuma');

  const gov = await baixar(ALVOS[1]);
  console.log(`Governador: ${Object.keys(gov.pares).length} pares, ${Object.keys(gov.municipios).length} municípios`);
  for (const uf of UFS_GOVERNADOR_2T) {
    const sub = { pares: Object.fromEntries(Object.entries(gov.pares).filter(([, p]) => p.uf === uf)) };
    const cg = await conferir(sub, `${BASE}/6259/dados/${uf}/${uf}-c0003-e006259-u.json`);
    console.log(`  ${uf.toUpperCase()}: ${Object.keys(sub.pares).length} pares. Divergências vs UF:`, cg.divergentes.length ? cg.divergentes : 'nenhuma');
  }
})().catch(e => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});
