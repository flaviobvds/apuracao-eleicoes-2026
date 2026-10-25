/**
 * Histórico minuto a minuto do 2º turno no Upstash Redis (plano gratuito, via integração da Vercel).
 *
 * Uma hash por corrida: chave st2026:hist:<corridaId>, campo = minuto UTC ("2026-10-25T20:05"),
 * valor = ponto compacto [tMs, pctSecoes, oficial, metrica1, metrica2] (% do candidato 0).
 * Sem as variáveis de ambiente do Redis, tudo vira no-op e o site segue com o histórico local do navegador.
 */

const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PREFIXO = 'st2026:hist:';

const disponivel = () => !!(URL_REDIS && TOKEN_REDIS);

async function redis(caminho, corpo) {
  const r = await fetch(`${URL_REDIS}${caminho}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_REDIS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(4000)
  });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return r.json();
}

const minutoDe = t => new Date(t).toISOString().slice(0, 16);

let ultimoMinutoGravado = null;
let gravouEncerrada = false;

function pontoDe(corrida, t) {
  const n0 = corrida.candidatos[0].numero;
  const pct = m => (corrida[m] && corrida[m][n0] ? corrida[m][n0].pct : null);
  return [t, corrida.apuracao.pctSecoes, pct('oficial'), pct('metrica1'), pct('metrica2')];
}

/** Grava um ponto por corrida no minuto do snapshot (no máximo uma gravação por minuto por instância). */
async function gravarSnapshot(snapshot) {
  if (!disponivel() || snapshot.simulacao || snapshot.status === 'aguardando') return;
  if (snapshot.status === 'encerrada' && gravouEncerrada) return;

  const t = Date.parse(snapshot.atualizadoEm) || Date.now();
  const minuto = minutoDe(t);
  if (minuto === ultimoMinutoGravado) return;

  const corridas = [snapshot.presidente.nacional, ...snapshot.presidente.ufs, ...snapshot.governador];
  const comandos = corridas.map(c => ['HSET', PREFIXO + c.id, minuto, JSON.stringify(pontoDe(c, t))]);
  try {
    await redis('/pipeline', comandos);
    ultimoMinutoGravado = minuto;
    if (snapshot.status === 'encerrada') gravouEncerrada = true;
  } catch (e) {
    console.error('Falha ao gravar histórico do 2º turno:', e.message);
  }
}

/** Lê a série de uma corrida, em ordem de tempo. */
async function lerHistorico(corridaId) {
  if (!disponivel()) return { disponivel: false, pontos: [] };
  const { result } = await redis('', ['HGETALL', PREFIXO + corridaId]);
  const pontos = [];
  for (let i = 1; i < (result || []).length; i += 2) {
    try {
      pontos.push(JSON.parse(result[i]));
    } catch {
      // ponto corrompido: ignora
    }
  }
  pontos.sort((a, b) => a[0] - b[0]);
  return { disponivel: true, pontos };
}

module.exports = { gravarSnapshot, lerHistorico, disponivel };
