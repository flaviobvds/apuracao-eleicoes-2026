const app = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Servidor de Apuracao 2026] Executando na porta ${PORT}`);
  console.log(`API disponivel em: http://localhost:${PORT}/api/apuracao`);
});
