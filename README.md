# Apuração & Projeção 100% - Eleições Presidenciais 2026

Aplicação interativa para acompanhamento da apuração presidencial das Eleições de 2026, com foco exclusivo na **dinâmica de urnas apuradas vs. urnas restantes** (por Estado e por Região do Brasil) e na **simulação do resultado final a 100% dos votos válidos**, mantendo as proporções parciais observadas até o momento.

---

## 🌟 Principais Recursos

1. **Foco em Urnas Apuradas vs. Urnas Restantes**:
   - Totalização nacional baseada nas **534.671 seções eleitorais/urnas** mapeadas no Brasil e no exterior (dados oficiais TSE).
   - Medidores visuais com barra bicolor, contadores absolutos e percentuais de urnas pendentes.
2. **Motor de Projeção Matemática a 100%**:
   - Projeta os votos válidos restantes de cada candidato em cada estado/região com base na proporção atual observada no local:
     $$V_{\text{proj}, c}(UF) = V_c(UF) \times \frac{U_{\text{total}}(UF)}{U_{\text{apuradas}}(UF)}$$
   - Agrega o total nacional e calcula o **Delta ($\Delta$)** entre o resultado parcial e a projeção final a 100%, evidenciando viradas e consolidações provocadas pelas urnas pendentes.
3. **Visões Interativas Alternáveis**:
   - **Visão por Região**: 6 cartões detalhados (Norte, Nordeste, Centro-Oeste, Sudeste, Sul, Exterior ZZ), comparativo em gráfico de barras de urnas pendentes e impacto dos votos a entrar por macrorregião.
   - **Visão por Estado (UF)**: Tabela interativa dos 27 estados + DF + Exterior, com busca, filtros regionais e ordenação prioritária por **Mais Urnas Restantes**, **% de Apuração** ou **Vantagem do Líder**.
4. **Auto-Atualização em Tempo Real**:
   - Alternador de auto-atualização com intervalos configuráveis (5s, 10s, 30s) e contagem regressiva visual.
   - Botão para atualização imediata.
5. **Simulador de Cenários Eleitorais & Ticker ao Vivo**:
   - **Descompasso Regional Típico**: reproduz a clássica dinâmica eleitoral brasileira em que Sul/Sudeste adiantam a contagem (~75%) enquanto Nordeste e Norte avançam em outro ritmo (~35%), revelando o poder da projeção.
   - **Início da Apuração (20%)**, **Metade Apurada (50%)**, **Reta Final (92%)** e **100% Totalizado**.
   - Modo **"Simular Noite da Eleição"** que avança gradualmente as urnas a cada ciclo para ver as curvas convergirem ao vivo.
6. **Integração com API Oficial do TSE**:
   - Preparado para o pleito de 2026 (`pleito 3220`, `eleicao 6257` para Presidente 1º Turno e `6258` para 2º Turno, cargo `c0001`).
   - Verificação automática de status com fallback inteligente quando os servidores ainda não liberaram os arquivos da apuração.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ (testado no Node.js v22)

### Instalação e Execução

O projeto já vem pronto com o backend e o frontend compilados.

```bash
# Iniciar o servidor integrado (API + Frontend)
npm start
```

A aplicação estará acessível em:
👉 **[http://localhost:3001](http://localhost:3001)**

Para rodar em modo de desenvolvimento com hot-reload no frontend:
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend Vite
npm run client:dev
```

---

## 📐 Estrutura do Projeto

```
c:/Projects/apuracao/
├── client/                     # Interface React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeaderNav.jsx            # Cabeçalho com abas, auto-refresh e status
│   │   │   ├── UrnasBar.jsx             # Barra visual de Urnas Apuradas vs Restantes
│   │   │   ├── NationalScoreboard.jsx   # Placar nacional Parcial vs 100% Projetado
│   │   │   ├── RegionView.jsx           # Visão agregada pelas 6 regiões com gráficos
│   │   │   ├── StateView.jsx            # Visão detalhada dos 28 entes federativos
│   │   │   └── SimulationDrawer.jsx     # Controles de cenários e ticker de apuração
│   │   ├── App.jsx                      # Componente principal
│   │   └── index.css                    # Estilização Tailwind
│   └── dist/                            # Build de produção servido pelo Express
│
├── server/                     # Backend Express
│   ├── data/
│   │   └── brazilElectoralData.js       # Base oficial de seções/urnas e candidatos 2026
│   ├── services/
│   │   ├── projectionCalculator.js      # Motor matemático de projeção a 100%
│   │   ├── simulationEngine.js          # Motor dinâmico de simulação e cenários
│   │   └── tseService.js                # Cliente de integração com a API do TSE
│   ├── index.js                         # Servidor Express com rotas de API
│   └── test_projection.js               # Teste unitário das projeções
│
└── package.json
```
