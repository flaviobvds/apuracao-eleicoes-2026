# Apuração & Projeção Oficial TSE - Eleições Gerais 2026

Aplicação web interativa para acompanhamento em tempo real da apuração das **Eleições Gerais de 2026**, conectada aos dados oficiais do Tribunal Superior Eleitoral (TSE).

A plataforma oferece duas frentes principais:
1. **Presidente da República**: Foco na dinâmica de **Urnas Apuradas vs. Restantes** e na **Projeção Matemática a 100% dos Votos Válidos**.
2. **Deputados Federais, Estaduais e Distritais**: Cálculo exato da **distribuição de vagas proporcionais por partido/federação** segundo o Código Eleitoral brasileiro (Quociente Eleitoral, Quociente Partidário e Sobras D'Hondt).

---

## 🌟 Principais Módulos e Recursos

### 1. 🇧🇷 Apuração Presidencial & Projeção 100%
- **Monitoramento de Urnas em Tempo Real**:
  - Acompanhamento das **534.671 seções eleitorais/urnas** mapeadas no Brasil e no exterior.
  - Indicadores visuais com barra de progresso, total de urnas apuradas e urnas pendentes.
- **Motor de Projeção Matemática 100%**:
  - Projeta a totalização final baseada na distribuição proporcional dos votos já computados em cada localidade:
    $$V_{\text{proj}, c}(UF) = V_c(UF) \times \frac{U_{\text{total}}(UF)}{U_{\text{apuradas}}(UF)}$$
  - Exibe o **Delta ($\Delta$)** entre o resultado parcial e a projeção final, evidenciando o impacto das urnas que ainda faltam abrir.
- **Visões Estratégicas Alternáveis**:
  - **Visão por Região**: 6 cartões detalhados (Norte, Nordeste, Centro-Oeste, Sudeste, Sul e Exterior ZZ) com comparativo de apuração e impacto dos votos pendentes.
  - **Visão por Estado (UF)**: Tabela interativa dos 27 estados + DF + Exterior, com ordenação por urnas restantes, percentual de apuração ou vantagem do líder.
- **Auto-Atualização Inteligente**:
  - Ciclo configurável (5s, 10s ou 30s) com contagem regressiva e atualização manual sob demanda.

---

### 2. 👥 Deputados Federais, Estaduais e Distritais (Cálculo Proporcional)
- **Aplicação Rigorosa das Regras Oficiais do TSE**:
  - **Quociente Eleitoral (QE)**: $\text{QE} = \lfloor \frac{\text{Votos Válidos}}{\text{Vagas em Disputa}} \rfloor$.
  - **Quociente Partidário (QP)**: $\text{QP} = \lfloor \frac{\text{Votos da Legenda}}{\text{QE}} \rfloor$, com exigência da **cláusula de barreira individual de 10% do QE** para os candidatos ocuparem a vaga pelo QP.
  - **Distribuição de Sobras por Maiores Médias (Regra D'Hondt)**:
    - Aplicação da média: $\text{Média} = \frac{\text{Votos do Partido}}{\text{Vagas Obtidas} + 1}$.
    - Regra 80/20: Partidos com no mínimo 80% do QE e candidatos com votação individual de pelo menos 20% do QE (com repescagem legal caso restem vagas).
- **Organização por Bancadas Conquistadas**:
  - Partidos e federações ranqueados pelo número total de vagas conquistadas (QP + Sobras).
- **Cards Interativos Expansíveis por Partido**:
  - **Candidatos que estão Entrando (Eleitos)**: Classificação nominal, partido de origem em federações e tipo de vaga conquistada (*Por QP* ou *Por Média*).
  - **Candidatos que estão Ficando de Fora (Próximos Suplentes)**: Posição de suplência e cálculo da **diferença exata de votos** que faltou para assumir a cadeira.
- **Navegação Completa em Ordem Alfabética (AC a TO)**:
  - 27 botões de atalho rápido e menu suspenso (dropdown) ordenados rigorosamente de `AC` a `TO`.
- **Alternância de Cargos**:
  - **Deputado Federal**: Câmara dos Deputados (513 cadeiras distribuídas pelas 27 UFs).
  - **Deputado Estadual / Distrital**: Assembleias Legislativas estaduais e CLDF (1.059 cadeiras).

---

### 3. 🔗 Roteamento SPA & Compartilhamento por Link Direto
- **Links Diretos sem Erro 404**:
  - Acesso direto à rota `/deputados` e à página inicial `/`.
- **Filtros Sincronizados na URL**:
  - Ao alternar entre estados ou cargos, os parâmetros da URL são atualizados automaticamente via `history.replaceState`:
    - `https://.../deputados?uf=SP&cargo=federal`
    - `https://.../deputados?uf=RJ&cargo=estadual`
    - `https://.../deputados?uf=DF&cargo=estadual`
  - Permite copiar o link da barra do navegador e compartilhar exatamente a mesma visão com outros usuários.
- **Navegação Fluida no Navegador**:
  - Suporte completo aos botões "Voltar" e "Avançar" (`popstate`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - **React 19**
  - **Vite 6**
  - **Tailwind CSS 4**
  - **Lucide React** (Ícones modernos)
- **Backend & API**:
  - **Node.js 22**
  - **Express 4**
  - **Axios** (Consumo da API oficial do TSE com caching e tratamento de resiliência)
- **Deploy & Infraestrutura**:
  - **Vercel** (Deploy Serverless com rewrites SPA)
  - **GitHub** (Controle de versão e CI/CD)

---

## 📁 Estrutura do Projeto

```
c:/Projects/apuracao/
├── api/
│   └── index.js                      # Handler Serverless para a Vercel
├── client/                           # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeaderNav.jsx         # Cabeçalho com abas, auto-refresh e navegação
│   │   │   ├── UrnasBar.jsx          # Barra de Urnas Apuradas vs. Restantes
│   │   │   ├── NationalScoreboard.jsx# Placar Nacional Parcial vs. Projeção 100%
│   │   │   ├── RegionView.jsx        # Visão detalhada pelas 6 macrorregiões
│   │   │   ├── StateView.jsx         # Tabela interativa dos estados (Presidente)
│   │   │   └── DeputadosView.jsx     # Página de Deputados (Cálculo Proporcional TSE)
│   │   ├── App.jsx                   # Roteamento SPA e orquestração do estado
│   │   └── main.jsx                  # Ponto de entrada do React
│   └── dist/                         # Build otimizado de produção
├── server/                           # Backend Express & Serviços Eleitorais
│   ├── data/
│   │   ├── brazilElectoralData.js    # Dados eleitorais, seções e candidatos presidenciais
│   │   └── deputadosSeatsData.js     # Mapeamento de vagas federais e estaduais por UF
│   ├── services/
│   │   ├── projectionCalculator.js   # Algoritmo de projeção matemática a 100%
│   │   ├── proportionalCalculator.js # Motor de regras proporcionais do TSE (QE, QP, D'Hondt)
│   │   ├── simulationEngine.js       # Motor de cenários de teste
│   │   ├── tseDeputadosService.js    # Integração de deputados com a API do TSE
│   │   └── tseService.js             # Integração presidencial com a API do TSE
│   ├── app.js                        # Configuração do Express e rotas da API
│   └── index.js                      # Inicialização do servidor local
├── vercel.json                       # Configuração de rewrites SPA e serverless na Vercel
└── package.json                      # Scripts e dependências raiz
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js 18+** (recomendado v20 ou v22)
- **npm** instalado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/flaviobvds/apuracao-eleicoes-2026.git
cd apuracao-eleicoes-2026

# Instale as dependências da raiz e do cliente
npm install
npm --prefix client install
```

### Executar em Produção Integrada
O backend serve a API e os arquivos estáticos compilados do frontend na mesma porta:

```bash
# Compilar o frontend e iniciar o servidor
npm run build
npm start
```
Acesse: 👉 **[http://localhost:3001](http://localhost:3001)**

### Executar em Modo de Desenvolvimento
```bash
# Terminal 1: Iniciar a API Express (porta 3001)
npm run dev

# Terminal 2: Iniciar o servidor Vite com Hot-Reload (porta 5173)
npm run client:dev
```
Acesse: 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/apuracao` | Retorna apuração presidencial consolidada, projeção 100%, totais de urnas e status da conexão com o TSE. |
| `GET` | `/api/deputados?uf={UF}&cargo={federal\|estadual}` | Retorna o cálculo proporcional de vagas, QE, QP, bancadas e lista de eleitos/suplentes da UF informada. |

---

## ⚖️ Licença
Distribuído sob licença aberta para fins de transparência pública e acompanhamento cívico do processo eleitoral brasileiro de 2026.
