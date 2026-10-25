/**
 * Projeções do 2º turno por par município × zona.
 *
 * Métrica 1: votos apurados reais + votos que faltam divididos pela proporção do 1º turno
 *            entre os dois finalistas (ignora os demais candidatos).
 * Métrica 2: votos apurados reais + votos que faltam divididos por uma mistura entre o
 *            resultado já apurado no par e a proporção do 1º turno corrigida pelo swing
 *            observado (em escala logística) nos pares já apurados da UF.
 *
 * Os votos que faltam em cada par = eleitorado ainda não apurado × votos válidos por eleitor
 * no 1º turno × fator de comparecimento observado na UF (1 antes da apuração).
 */

// Peso (em votos) que puxa swing e fator de comparecimento para a referência enquanto há poucos dados
const PESO_PRIOR = 20000;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const logit = p => { const q = clamp(p, 0.001, 0.999); return Math.log(q / (1 - q)); };
const invLogit = x => 1 / (1 + Math.exp(-x));

/**
 * @param {object[]} pares lista de { key, uf, t1: {a, b, vv, te}, t2: {a, b, te, est, st, ts} | null }
 *        a = votos do candidato 0, b = votos do candidato 1. O swing de cada UF é puxado para o
 *        nacional da própria lista (no governador a lista tem uma UF só).
 * @returns {object} parâmetros calibrados { kNacional, kPorUf, swingNacional, swingPorUf, s1PorUf }
 */
function calibrar(pares) {
  const porUf = {};
  const nac = { v2: 0, esp: 0, wd: 0, w: 0 };
  const s1Uf = {};

  for (const p of pares) {
    const u = (porUf[p.uf] ||= { v2: 0, esp: 0, wd: 0, w: 0 });
    const s = (s1Uf[p.uf] ||= { a: 0, b: 0 });
    s.a += p.t1.a; s.b += p.t1.b;

    const v2 = p.t2 ? p.t2.a + p.t2.b : 0;
    if (!v2 || !p.t1.te || !(p.t1.a + p.t1.b)) continue;

    const esperado = p.t2.est * (p.t1.vv / p.t1.te);
    const d = logit(p.t2.a / v2) - logit(p.t1.a / (p.t1.a + p.t1.b));
    for (const acc of [u, nac]) {
      acc.v2 += v2;
      acc.esp += esperado;
      acc.wd += v2 * d;
      acc.w += v2;
    }
  }

  const kNacional = (nac.v2 + PESO_PRIOR) / (nac.esp + PESO_PRIOR);
  const swingNacional = nac.wd / (nac.w + PESO_PRIOR);
  const kPorUf = {};
  const swingPorUf = {};
  const s1PorUf = {};
  for (const [uf, u] of Object.entries(porUf)) {
    kPorUf[uf] = (u.v2 + PESO_PRIOR * kNacional) / (u.esp + PESO_PRIOR);
    swingPorUf[uf] = (u.wd + PESO_PRIOR * swingNacional) / (u.w + PESO_PRIOR);
    const s = s1Uf[uf];
    s1PorUf[uf] = s.a + s.b ? s.a / (s.a + s.b) : 0.5;
  }
  return { kNacional, kPorUf, swingNacional, swingPorUf, s1PorUf };
}

/**
 * Soma as projeções dos pares informados usando parâmetros já calibrados.
 * Retorna votos projetados de cada candidato nas duas métricas e na referência pré-apuração.
 */
function projetar(pares, cal) {
  const r = {
    m1: { a: 0, b: 0 },
    m2: { a: 0, b: 0 },
    pre: { a: 0, b: 0 },
    obs: { a: 0, b: 0, s1w: 0 },
    comApuracao: 0,
    completos: 0
  };

  for (const p of pares) {
    const t1 = p.t1;
    const t2 = p.t2 || { a: 0, b: 0, te: t1.te, est: 0, st: 0, ts: t1.ts || 0 };
    const v2 = t2.a + t2.b;
    const s1 = t1.a + t1.b ? t1.a / (t1.a + t1.b) : (cal.s1PorUf[p.uf] ?? 0.5);

    r.pre.a += t1.vv * s1;
    r.pre.b += t1.vv * (1 - s1);

    if (t2.est > 0 || v2 > 0) r.comApuracao++;
    if (t2.ts > 0 && t2.st >= t2.ts) r.completos++;
    if (v2 > 0) {
      r.obs.a += t2.a;
      r.obs.b += t2.b;
      r.obs.s1w += v2 * s1;
    }

    const te = t2.te || t1.te;
    const faltam = Math.max(0, te - t2.est);
    const k = cal.kPorUf[p.uf] ?? cal.kNacional;
    const vRestante = t1.te ? faltam * (t1.vv / t1.te) * k : 0;

    r.m1.a += t2.a + vRestante * s1;
    r.m1.b += t2.b + vRestante * (1 - s1);

    const swing = cal.swingPorUf[p.uf] ?? cal.swingNacional;
    const sPrior = invLogit(logit(s1) + swing);
    const f = te ? clamp(t2.est / te, 0, 1) : 0;
    const sRest = v2 > 0 ? f * (t2.a / v2) + (1 - f) * sPrior : sPrior;
    r.m2.a += t2.a + vRestante * sRest;
    r.m2.b += t2.b + vRestante * (1 - sRest);
  }
  return r;
}

module.exports = { calibrar, projetar, PESO_PRIOR, logit, invLogit };
