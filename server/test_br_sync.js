const { fetchJson, TSE_CONFIG_2026, CANDIDATE_METADATA } = require('./services/tseService');

(async () => {
  const brUrl = `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json`;
  const resp = await fetch(brUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const data = await resp.json();

  const st = parseInt(data.s.st, 10);
  const ts = parseInt(data.s.ts, 10);
  const pst = parseFloat(data.s.pst.replace(',', '.'));
  const vvc = parseInt(data.v.vvc, 10);

  console.log('--- DADOS OFICIAIS TSE NACIONAL ---');
  console.log(`Seções Apuradas: ${data.s.pst}% (${st.toLocaleString('pt-BR')} de ${ts.toLocaleString('pt-BR')})`);
  console.log(`Votos Válidos Concorrentes: ${vvc.toLocaleString('pt-BR')}`);

  const cands = [];
  data.carg[0].agr.forEach(agr => {
    agr.par.forEach(par => {
      par.cand.forEach(c => {
        const vap = parseInt(c.vap, 10);
        const pvap = parseFloat(c.pvap.replace(',', '.'));
        const meta = CANDIDATE_METADATA[c.n];
        cands.push({
          number: c.n,
          name: meta ? meta.shortName : c.nm,
          party: meta ? meta.party : par.sg,
          vap,
          pvap
        });
      });
    });
  });

  cands.sort((a, b) => b.vap - a.vap);
  cands.forEach(c => {
    console.log(`${c.number} | ${c.name} (${c.party}): ${c.pvap.toFixed(2)}% (${c.vap.toLocaleString('pt-BR')} votos válidos)`);
  });
})();
