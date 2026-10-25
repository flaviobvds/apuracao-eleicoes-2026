// Mensagens comuns: cabeçalho, rodapés, seletor de idioma, modal base, barra de status,
// página do 2º turno e rótulos de utils.js (pt e en com as mesmas chaves).
export default {
  pt: {
    // utils.js
    'metrica.oficial': 'Apurado (TSE)',
    'metrica.oficial.curto': 'Oficial',
    'metrica.m1': 'Métrica 1 · Proporção do 1º turno',
    'metrica.m1.curto': 'M1',
    'metrica.m2': 'Métrica 2 · Tempo real',
    'metrica.m2.curto': 'M2',
    'destaque.pre': 'Projeção pré-apuração',
    'destaque.oficial': 'Resultado oficial (TSE)',
    'destaque.m2': 'Projeção em tempo real · Métrica 2',
    'destaque.m1': 'Métrica 1 · Proporção do 1º turno',
    candidato: 'Candidato',
    'uf.br': 'Brasil',
    'uf.zz': 'Exterior',

    // documento
    'doc.tituloSegundoTurno': 'Segundo turno 2026 · Apuração e projeções',
    'doc.tituloAntigas': 'Eleições 2026 · Apuração e projeções',

    // seletor de idioma
    'idioma.aria': 'Idioma',
    'idioma.nome.pt': 'Português',
    'idioma.nome.en': 'English',

    // cabeçalho
    'header.titulo': 'Eleições 2026',
    'header.subtitulo': 'Apuração e Projeção Oficial TSE',
    'header.aoVivo': 'AO VIVO',
    'header.abaSegundoTurno': 'Segundo Turno',
    'header.seloSegundoTurno': '2º turno',
    'header.abaPrimeiroTurnoCurta': '1º turno',
    'header.abaPrimeiroTurno': 'Presidente 1º turno',
    'header.abaDeputadosCurta': 'Deputados',
    'header.abaDeputados': 'Deputados (Câmara & Assembleias)',
    'header.regiao': 'Região',
    'header.estado': 'Estado (UF)',
    'header.atualizar': 'Atualizar dados agora',

    // rodapés
    'rodape.fonte': 'Fonte: API pública de divulgação de resultados do TSE (resultados.tse.jus.br). Projeções são estimativas estatísticas, não resultados oficiais.',
    'rodape.segundoTurno': 'Eleições Gerais 2026 • 2º turno',
    'rodape.presidenteTitulo': 'Projeção 100% dos Votos Válidos (Presidente)',
    'rodape.deputadosTitulo': 'Cálculo Proporcional do TSE (Deputados Federais e Estaduais)',
    'rodape.presidenteTexto': 'Cálculo baseado nos dados oficiais do TSE aplicados às seções eleitorais restantes de cada localidade.',
    'rodape.deputadosTexto': 'Aplicação das regras do Código Eleitoral: Quociente Eleitoral (QE), Quociente Partidário (QP) e Sobras D\'Hondt.',
    'rodape.antigas': 'Eleições Gerais 2026 • Dados Oficiais TSE',

    // sobre o desenvolvedor
    'sobre.titulo': 'Sobre o desenvolvedor',
    'sobre.papel': 'Desenvolvedor deste site',
    'sobre.texto': 'Este site acompanha a apuração das Eleições 2026 com os dados públicos de divulgação do TSE e duas projeções estatísticas para o resultado final.',

    // modal base
    'modal.fechar': 'Fechar',

    // barra de status
    'status.apurando.curto': 'Ao vivo',
    'status.apurando.longo': 'Ao vivo · apurando',
    'status.aguardando.curto': 'Aguardando',
    'status.aguardando.longo': 'Aguardando apuração',
    'status.encerrada.curto': 'Encerrada',
    'status.encerrada.longo': 'Apuração encerrada',
    'status.conectando': 'Conectando…',
    'status.atualizado': 'Atualizado ',
    'status.as': 'às ',
    'status.atualizarAgora': 'Atualizar agora',
    'status.atualizarAria': 'Atualizar agora (próxima atualização em {s} s)',
    'status.falha': 'Falha ao atualizar ({erro}).',
    'status.mostrandoDados': 'Mostrando os dados de {hora}; nova tentativa em {s}s.',
    'status.novaTentativa': 'Nova tentativa em {s}s.',
    'erro.respostaInvalida': 'resposta inválida',
    'erro.conexao': 'falha de conexão',

    // página do 2º turno
    'pagina.sobretitulo': 'Eleições 2026 · 25 de outubro',
    'pagina.titulo': 'Segundo turno',
    'pagina.subtitulo': 'Apuração oficial do TSE e duas projeções para 100% das urnas.',
    'pagina.carregando': 'Carregando a apuração do 2º turno…',
    'pagina.erroTitulo': 'Não foi possível carregar os dados do 2º turno.',
    'pagina.erroRetentativa': 'Tentaremos de novo automaticamente em {s}s.',
    'pagina.tentarAgora': 'Tentar agora',
    'pagina.cargo': 'Cargo',
    'pagina.presidente': 'Presidente',
    'pagina.governadores': 'Governadores',
    'pagina.placarIndisponivel': 'Placar nacional indisponível.',
    'pagina.tituloGrafico': 'Presidente · {nome}',
    'pagina.seletorGrafico': 'Corrida exibida no gráfico',
  },
  en: {
    // utils.js
    'metrica.oficial': 'Counted (TSE)',
    'metrica.oficial.curto': 'Official',
    'metrica.m1': 'Metric 1 · 1st-round ratio',
    'metrica.m1.curto': 'M1',
    'metrica.m2': 'Metric 2 · Live projection',
    'metrica.m2.curto': 'M2',
    'destaque.pre': 'Pre-count projection',
    'destaque.oficial': 'Official result (TSE)',
    'destaque.m2': 'Live projection · Metric 2',
    'destaque.m1': 'Metric 1 · 1st-round ratio',
    candidato: 'Candidate',
    'uf.br': 'Brazil',
    'uf.zz': 'Abroad',

    // documento
    'doc.tituloSegundoTurno': 'Brazil 2026 · Presidential runoff · Live count',
    'doc.tituloAntigas': 'Brazil Elections 2026 · Live count & projections',

    // seletor de idioma
    'idioma.aria': 'Language',
    'idioma.nome.pt': 'Português',
    'idioma.nome.en': 'English',

    // cabeçalho
    'header.titulo': 'Brazil Elections 2026',
    'header.subtitulo': 'Live count & projections · official TSE data',
    'header.aoVivo': 'LIVE',
    'header.abaSegundoTurno': 'Runoff',
    'header.seloSegundoTurno': 'Runoff',
    'header.abaPrimeiroTurnoCurta': '1st round',
    'header.abaPrimeiroTurno': 'President 1st round',
    'header.abaDeputadosCurta': 'Deputies',
    'header.abaDeputados': 'Deputies (Chamber & State Assemblies)',
    'header.regiao': 'Region',
    'header.estado': 'State',
    'header.atualizar': 'Refresh data now',

    // rodapés
    'rodape.fonte': 'Source: TSE public results API (resultados.tse.jus.br). Projections are statistical estimates, not official results.',
    'rodape.segundoTurno': 'Brazil General Elections 2026 • Runoff',
    'rodape.presidenteTitulo': '100% valid-vote projection (President)',
    'rodape.deputadosTitulo': 'TSE proportional seat allocation (Federal and State Deputies)',
    'rodape.presidenteTexto': 'Based on official TSE data applied to the remaining polling stations in each area.',
    'rodape.deputadosTexto': 'Applies the Electoral Code rules: electoral quotient (QE), party quotient (QP) and D\'Hondt remainders.',
    'rodape.antigas': 'Brazil General Elections 2026 • Official TSE data',

    // sobre o desenvolvedor
    'sobre.titulo': 'About the developer',
    'sobre.papel': 'Developer of this site',
    'sobre.texto': 'This site follows the 2026 Brazilian election count using the TSE public results data and two statistical projections of the final result.',

    // modal base
    'modal.fechar': 'Close',

    // barra de status
    'status.apurando.curto': 'Live',
    'status.apurando.longo': 'Live · counting',
    'status.aguardando.curto': 'Waiting',
    'status.aguardando.longo': 'Waiting for count',
    'status.encerrada.curto': 'Final',
    'status.encerrada.longo': 'Count complete',
    'status.conectando': 'Connecting…',
    'status.atualizado': 'Updated ',
    'status.as': 'at ',
    'status.atualizarAgora': 'Refresh now',
    'status.atualizarAria': 'Refresh now (next update in {s} s)',
    'status.falha': 'Update failed ({erro}).',
    'status.mostrandoDados': 'Showing data from {hora} (Brasília time); retrying in {s}s.',
    'status.novaTentativa': 'Retrying in {s}s.',
    'erro.respostaInvalida': 'invalid response',
    'erro.conexao': 'connection failure',

    // página do 2º turno
    'pagina.sobretitulo': 'Brazil 2026 · October 25',
    'pagina.titulo': 'Presidential runoff',
    'pagina.subtitulo': 'Official TSE count and two projections to 100% of voting machines.',
    'pagina.carregando': 'Loading the runoff count…',
    'pagina.erroTitulo': 'Could not load the runoff data.',
    'pagina.erroRetentativa': 'We will retry automatically in {s}s.',
    'pagina.tentarAgora': 'Retry now',
    'pagina.cargo': 'Office',
    'pagina.presidente': 'President',
    'pagina.governadores': 'Governors',
    'pagina.placarIndisponivel': 'National scoreboard unavailable.',
    'pagina.tituloGrafico': 'President · {nome}',
    'pagina.seletorGrafico': 'Race shown in the chart',
  },
};
