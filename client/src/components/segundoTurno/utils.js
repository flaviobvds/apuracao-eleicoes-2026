// Utilitários compartilhados da página "Segundo Turno":
// formatação pt-BR, leitura defensiva da Corrida e cores dos candidatos.

export const UF_NOMES = {
  ac: 'Acre', al: 'Alagoas', am: 'Amazonas', ap: 'Amapá', ba: 'Bahia', ce: 'Ceará',
  df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão',
  mg: 'Minas Gerais', ms: 'Mato Grosso do Sul', mt: 'Mato Grosso', pa: 'Pará',
  pb: 'Paraíba', pe: 'Pernambuco', pi: 'Piauí', pr: 'Paraná', rj: 'Rio de Janeiro',
  rn: 'Rio Grande do Norte', ro: 'Rondônia', rr: 'Roraima', rs: 'Rio Grande do Sul',
  sc: 'Santa Catarina', se: 'Sergipe', sp: 'São Paulo', to: 'Tocantins',
  zz: 'Exterior', br: 'Brasil',
};

export const METRICAS = [
  { key: 'oficial', curto: 'Oficial', label: 'Apurado (TSE)' },
  { key: 'metrica1', curto: 'M1', label: 'Métrica 1 · Proporção do 1º turno' },
  { key: 'metrica2', curto: 'M2', label: 'Métrica 2 · Tempo real' },
];

export const TZ = 'America/Sao_Paulo';

export function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function fmtPct(v, digits = 2) {
  if (!isNum(v)) return '—';
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function fmtNum(v) {
  if (!isNum(v)) return '—';
  return Math.round(v).toLocaleString('pt-BR');
}

export function fmtDec(v, digits = 2) {
  if (!isNum(v)) return '—';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPp(v, digits = 2, withSign = false) {
  if (!isNum(v)) return '—';
  const s = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (!withSign) return `${s} p.p.`;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${s} p.p.`;
}

export function fmtHora(iso, withSeconds = true) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), timeZone: TZ,
  });
}

// "25/10/2026 17:05:10" -> "17:05:10"
export function horaTse(tseDataHora) {
  if (!tseDataHora || typeof tseDataHora !== 'string') return null;
  const parts = tseDataHora.trim().split(/\s+/);
  return parts[1] || parts[0] || null;
}

export function fmtDuracao(ms) {
  if (!isNum(ms) || ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function nomeUf(uf, fallback) {
  return fallback || UF_NOMES[(uf || '').toLowerCase()] || (uf || '').toUpperCase();
}

export function siglaUf(uf) {
  const u = (uf || '').toLowerCase();
  if (u === 'zz') return 'EXT';
  return u.toUpperCase();
}

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'd', 'del']);

// "SANTA BÁRBARA D'OESTE" -> "Santa Bárbara d'Oeste"
export function tituloMunicipio(nome) {
  if (!nome || typeof nome !== 'string') return '';
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => {
      if (!w) return w;
      const ap = w.match(/^(d)['’](.+)$/);
      if (ap) return `d'${ap[2].charAt(0).toUpperCase()}${ap[2].slice(1)}`;
      if (i > 0 && MINUSCULAS.has(w)) return w;
      return w
        .split('-')
        .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
        .join('-');
    })
    .join(' ');
}

export function zonaSemZeros(zona) {
  if (zona == null) return '';
  const n = parseInt(String(zona), 10);
  return Number.isNaN(n) ? String(zona) : String(n);
}

// Remove acentos e baixa a caixa, para buscas.
export function normalizar(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// "campinas zona 33" -> { texto: 'campinas', zona: 33 }; "5" -> { texto: '', zona: 5 }
export function interpretarBusca(q) {
  const n = normalizar(q);
  let zona = null;
  let texto = n;
  const m = n.match(/\b(?:zona|zn|z)\s*(\d{1,4})\b/);
  if (m) {
    zona = parseInt(m[1], 10);
    texto = n.replace(m[0], ' ');
  } else {
    const d = n.match(/^\s*(\d{1,4})\s*$/);
    if (d) {
      zona = parseInt(d[1], 10);
      texto = '';
    }
  }
  return { texto: texto.replace(/\s+/g, ' ').trim(), zona };
}

// ---------- Leitura defensiva da Corrida ----------

export function candidatosDe(race) {
  const c = Array.isArray(race?.candidatos) ? race.candidatos : [];
  return [c[0] || null, c[1] || null];
}

// Retorna [pct0, pct1] (números ou null). Se só um vier, completa com 100 - x.
export function parPct(race, metricKey) {
  const [c0, c1] = candidatosDe(race);
  const obj = race?.[metricKey];
  if (!obj || !c0 || !c1) return [null, null];
  let a = obj[c0.numero]?.pct;
  let b = obj[c1.numero]?.pct;
  a = isNum(a) ? a : null;
  b = isNum(b) ? b : null;
  if (a == null && b != null) a = 100 - b;
  if (b == null && a != null) b = 100 - a;
  // 0% × 0% (nada apurado) é "sem dados", não empate
  if (a != null && b != null && a + b < 1) return [null, null];
  return [a, b];
}

export function parVotos(race, metricKey) {
  const [c0, c1] = candidatosDe(race);
  const obj = race?.[metricKey];
  if (!obj || !c0 || !c1) return [null, null];
  const a = obj[c0.numero]?.votos;
  const b = obj[c1.numero]?.votos;
  return [isNum(a) ? a : null, isNum(b) ? b : null];
}

export function temApuracao(race) {
  const p = race?.apuracao?.pctSecoes;
  return isNum(p) && p > 0;
}

// Métrica do "número grande": pré-apuração antes de começar, oficial ao fim, M2 durante.
export function metricaDestaque(race, status) {
  if (status === 'aguardando' || !temApuracao(race)) {
    const pre = parPct(race, 'metrica1PreApuracao');
    if (pre[0] != null) return { key: 'metrica1PreApuracao', label: 'Projeção pré-apuração', valores: pre };
  }
  if (status === 'encerrada' || race?.apuracao?.pctSecoes >= 100) {
    const of = parPct(race, 'oficial');
    if (of[0] != null) return { key: 'oficial', label: 'Resultado oficial (TSE)', valores: of };
  }
  const m2 = parPct(race, 'metrica2');
  if (m2[0] != null) return { key: 'metrica2', label: 'Projeção em tempo real · Métrica 2', valores: m2 };
  const m1 = parPct(race, 'metrica1');
  if (m1[0] != null) return { key: 'metrica1', label: 'Métrica 1 · Proporção do 1º turno', valores: m1 };
  const pre = parPct(race, 'metrica1PreApuracao');
  return { key: 'metrica1PreApuracao', label: 'Projeção pré-apuração', valores: pre };
}

// ---------- Cores ----------

const COR_PARTIDO = {
  PT: '#dc2626',
  PL: '#2563eb',
  PSD: '#0ea5e9',
  PP: '#4f46e5',
  REPUBLICANOS: '#0e7490',
  MDB: '#16a34a',
  'UNIÃO': '#f59e0b',
  UNIAO: '#f59e0b',
  PSDB: '#60a5fa',
  PSB: '#f97316',
  PDT: '#e11d48',
  PSOL: '#eab308',
  NOVO: '#ea580c',
  PODE: '#22c55e',
  PCdoB: '#b91c1c',
};

const COR_NUMERO_PRESIDENTE = { 22: '#2563eb', 13: '#dc2626' };
const ALTERNATIVAS = ['#f59e0b', '#f97316', '#a855f7', '#10b981', '#ec4899', '#e2e8f0'];
const PADRAO = ['#94a3b8', '#f59e0b'];

function hexToHsl(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return { h: hue, s, l };
}

function parecidas(a, b) {
  const x = hexToHsl(a);
  const y = hexToHsl(b);
  if (x.s < 0.2 || y.s < 0.2) return Math.abs(x.l - y.l) < 0.15;
  const dh = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h));
  return dh < 32;
}

function corBase(cand, cargo, idx) {
  if (!cand) return PADRAO[idx];
  if (cargo === 'presidente' && COR_NUMERO_PRESIDENTE[cand.numero]) return COR_NUMERO_PRESIDENTE[cand.numero];
  const partido = String(cand.partido || '').toUpperCase();
  return COR_PARTIDO[partido] || COR_PARTIDO[cand.partido] || PADRAO[idx];
}

export function coresCorrida(raceOrCands, cargo) {
  const cands = Array.isArray(raceOrCands) ? raceOrCands : candidatosDe(raceOrCands);
  const tipo = cargo || raceOrCands?.cargo;
  const c0 = corBase(cands[0], tipo, 0);
  let c1 = corBase(cands[1], tipo, 1);
  if (parecidas(c0, c1)) {
    c1 = ALTERNATIVAS.find((alt) => !parecidas(c0, alt)) || '#f59e0b';
  }
  return [c0, c1];
}

// Clareia uma cor hex para uso em texto pequeno sobre fundo escuro.
export function clarear(hex, amt = 0.35) {
  if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = n.map((c) => Math.round(c + (255 - c) * amt));
  return `#${m.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function nomeCurto(cand) {
  return cand?.nome || cand?.nomeCompleto || 'Candidato';
}
