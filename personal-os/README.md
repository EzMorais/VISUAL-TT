<div align="center">

```
  ██████╗ ███████╗██████╗ ███████╗ ██████╗ ███╗   ██╗ █████╗ ██╗      ██████╗ ███████╗
  ██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗████╗  ██║██╔══██╗██║     ██╔═══██╗██╔════╝
  ██████╔╝█████╗  ██████╔╝███████╗██║   ██║██╔██╗ ██║███████║██║     ██║   ██║███████╗
  ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║   ██║██║╚██╗██║██╔══██║██║     ██║   ██║╚════██║
  ██║     ███████╗██║  ██║███████║╚██████╔╝██║ ╚████║██║  ██║███████╗╚██████╔╝███████║
  ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
```

**Seu ecossistema pessoal de produtividade.**  
Dashboard no Windows · App no iPhone · Bot no WhatsApp · Conexão via Tailscale.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Claude AI](https://img.shields.io/badge/Claude-AI-CC785C?style=flat-square)
![WhatsApp](https://img.shields.io/badge/WhatsApp-nativo-25D366?style=flat-square&logo=whatsapp&logoColor=white)
![Tailscale](https://img.shields.io/badge/Tailscale-VPN-000000?style=flat-square&logo=tailscale&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-iOS%20%2F%20Android-5A0FC8?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-App%20Desktop-47848F?style=flat-square&logo=electron&logoColor=white)

</div>

---

## O que é o Personal OS?

Personal OS é um **assistente pessoal que roda no seu próprio computador** e te acompanha onde você estiver. Ele conecta sua agenda, suas tarefas e uma IA em um único sistema — acessível pelo dashboard no Windows, pelo iPhone como um app instalado, e pelo WhatsApp para acesso rápido sem abrir nada.

Você não depende de nenhum serviço externo pago. Tudo roda localmente, seus dados ficam com você, e o Tailscale mantém a conexão segura entre todos os dispositivos de qualquer lugar do mundo.

---

## Instalação (Windows) — só o instalador, sem terminal

Não precisa de Node.js, terminal, nem rodar nada na mão. Um workflow do GitHub Actions builda o instalador pra você.

1. Vá na aba **[Actions](../../actions/workflows/build-installer.yml)** deste repositório.
2. Clique em **Run workflow** (botão à direita) → **Run workflow** de novo para confirmar.
3. Espere uns 5–10 minutos — o GitHub compila tudo num Windows limpo, na nuvem.
4. Abra a execução que terminou, role até **Artifacts**, baixe **Personal-OS-Setup**.
5. Extraia o `.zip` baixado (ele contém o `Personal OS Setup x.x.x.exe`) e dê 2 cliques.

O instalador é um `.exe` de verdade (NSIS): tela própria, opção de **escolher em qual pasta/disco instalar** (botão "Browse" na tela de instalação — funciona com qualquer drive, C:, D:, etc.), cria ícone na Área de Trabalho e atalho no Menu Iniciar, e já deixa o Personal OS configurado para abrir sozinho quando o Windows liga (dá pra desligar isso depois pelo ícone da bandeja do sistema).

> Publicar uma **tag** `personal-os-vX.Y.Z` (em vez de rodar manualmente) além de gerar o instalador também cria uma Release no GitHub — é o que alimenta a atualização automática do app (veja [`ATUALIZACOES.md`](./ATUALIZACOES.md)).

---

## Funcionalidades

### 📅 Agenda inteligente
Sincroniza com o Google Calendar e exibe seus compromissos de hoje e amanhã. Avisa automaticamente **15 minutos antes** de cada evento via WhatsApp, sem você precisar checar nada.

### ☀️ Briefing matinal
Todo dia no horário que você definir (padrão: 7h), o sistema gera um resumo do seu dia usando a IA — compromissos, prioridades, tarefas pendentes — e envia direto no WhatsApp.

### ✅ Gerenciador de tarefas
Crie tarefas com prioridade (alta, média, baixa) e data de vencimento. Gerencie pelo dashboard no computador ou pela conversa no WhatsApp, de onde estiver.

### 🤖 IA pessoal com memória
Chat com Claude AI que lembra o histórico da conversa. Pergunte qualquer coisa, peça ajuda para organizar seu dia, rascunhe textos, resolva dúvidas. Funciona no dashboard e no WhatsApp.

### ⏰ Lembretes personalizados
Crie lembretes para qualquer horário do dia. O aviso chega na hora certa pelo WhatsApp.

### 📱 WhatsApp sem API paga
O bot usa sua conta pessoal do WhatsApp via QR code — sem precisar de conta business, aprovação ou mensalidade. Você manda mensagem para si mesmo e o sistema responde.

### 🔒 Acesso remoto via Tailscale
Com o Tailscale instalado no computador e no iPhone, o dashboard fica acessível de qualquer lugar — em casa, no trabalho, na rua, no 4G — com conexão criptografada ponto a ponto.

### 💰 Área financeira
Contas, transações, orçamento por categoria e metas de economia. Registre gastos e receitas pelo dashboard, por voz ou direto no WhatsApp (`gasto 50 mercado`, `saldo`, `extrato`). O saldo, o resultado do mês e o progresso de cada meta ficam sempre visíveis.

### 🎯 Painel de objetivos com gráficos
Uma aba só para responder "o que eu preciso fazer agora": prioridades do dia (tarefas urgentes, próximo compromisso, orçamento estourado) e gráficos visuais — anel de tarefas concluídas, barras de gasto dos últimos 7 dias e anéis de progresso de cada meta.

### 🎙️ Comando de voz + Siri
Segure o botão de microfone no dashboard e fale — funciona em português, direto do Safari no iPhone. Também dá para acionar por **Atalho da Siri** ("Ei Siri, Personal OS...") usando a mesma API. Veja [`SIRI-SHORTCUTS.md`](./SIRI-SHORTCUTS.md).

### 📡 Tempo real entre PC e iPhone
Um canal WebSocket (`/ws`) liga todos os dispositivos conectados. Criou uma tarefa no computador? Aparece no iPhone na hora. Registrou um gasto pelo WhatsApp? O painel financeiro do PC atualiza sozinho — sem apertar F5. O selo **AO VIVO** no topo mostra a conexão em tempo real.

### 🔄 Atualizações automáticas
O dashboard avisa sozinho quando existe uma versão mais nova (banner com botão "Atualizar"). O app de desktop vai além: baixa e instala atualizações sozinho via GitHub Releases. Veja [`ATUALIZACOES.md`](./ATUALIZACOES.md) para o passo a passo de publicar uma nova versão.

### 💻 Terminal — conectado ao Claude, de qualquer lugar
Uma aba de terminal de verdade, com streaming em tempo real, para continuar trabalhando em ideias e projetos direto do celular. Não é um shell do sistema — é um chat com o Claude num visual de linha de comando, com histórico (seta ↑↓), comandos rápidos (`/lembrar`, `/memoria`, `/limpar`) e a mesma memória que o resto do app usa.

### 🧠 Memória adaptável
Guarde fatos sobre você (`/lembrar trabalho como designer`, `/lembrar prefiro respostas curtas`) e o Claude passa a usar isso em **todas** as conversas — chat, terminal, voz e briefing — sem você repetir contexto toda vez.

### 🩹 Autodiagnóstico de erros
Se algo quebra em qualquer tela do app, o erro é capturado automaticamente, o Claude é consultado sobre a causa provável, e o diagnóstico aparece ao vivo na aba Terminal. Cada painel do dashboard é isolado — se um travar, o resto continua funcionando normalmente.

### 📊 Uso
Acompanhe quantos tokens você consumiu hoje, no mês, e em qual área (chat, terminal, voz, WhatsApp, briefing) — com gráfico dos últimos 14 dias. Custo em R$ é opcional (veja `CLAUDE_INPUT_PRICE_PER_1M` no `.env.example`).

---

## Como funciona

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   iPhone                   Personal OS                          │
│   ┌──────────┐            ┌──────────────────┐                  │
│   │ WhatsApp │ ◄────────► │ whatsapp-web.js  │                  │
│   └──────────┘            │                  │◄──► Claude AI    │
│   ┌──────────┐            │ Node.js Backend  │                  │
│   │   PWA    │ ◄────────► │ Express + SQLite │◄──► Google Cal.  │
│   └──────────┘            │                  │                  │
│        ▲                  │ Scheduler / Cron │                  │
│        │ Tailscale VPN    └──────────────────┘                  │
│   ┌────┴─────┐                    ▲                             │
│   │ Windows  │◄───────────────────┘                             │
│   │Dashboard │     localhost:3001                               │
│   └──────────┘                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Início rápido

### Pré-requisitos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Tailscale** (para acesso remoto) — [tailscale.com/download/windows](https://tailscale.com/download/windows)
- **Chave da API Anthropic** — [console.anthropic.com](https://console.anthropic.com)

---

### 1 · Baixe o projeto

```bash
git clone https://github.com/EzMorais/VISUAL-TT
cd VISUAL-TT/personal-os
```

---

### 2 · Configure suas chaves

```bash
copy backend\.env.example backend\.env
```

Abra `backend\.env` e preencha:

```env
# Obrigatório — IA e WhatsApp
ANTHROPIC_API_KEY=sk-ant-...
WHATSAPP_PHONE=5511999999999     # seu número com DDI, sem espaços

# Horário e fuso
TIMEZONE=America/Sao_Paulo
BRIEFING_HOUR=7                  # briefing automático às 07:00

# Opcional — Google Calendar (veja seção abaixo)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

---

### 3 · Inicie

**No Windows, sem mexer em código:** use o instalador `.exe` (veja a seção [Instalação](#instalação-windows--só-o-instalador-sem-terminal) acima) — ele já sobe tudo numa janela própria, em **uma porta única (3001)**, acessível tanto na rede local quanto pelo Tailscale.

**Rodando direto do código** (desenvolvimento, ou outro sistema operacional):

```bash
cd backend && npm install && npm run dev    # janela 1
cd frontend && npm install && npm run dev   # janela 2
```

O backend sobe em `http://localhost:3001`, o frontend em `http://localhost:5173` (proxying `/api` e `/ws` para o backend). Para rodar em modo Tailscale a partir do código, defina `VITE_API_URL=http://SEU-IP-TAILSCALE:3001/api` antes de `npm run build` no frontend e sirva o `backend/public` resultante com `npm start` no backend.

---

### 4 · Conecte o WhatsApp

Quando o backend iniciar, um **QR code aparece no terminal**.

No iPhone:

> WhatsApp → Configurações → Aparelhos Conectados → Conectar Aparelho

Escaneie o QR e aguarde. O bot vai mandar uma mensagem de confirmação.

---

### 5 · Instale o app no iPhone

| Modo local (mesma Wi-Fi) | Modo Tailscale (qualquer lugar) |
|---|---|
| `http://SEU-IP-LOCAL:5173` | `http://100.x.x.x:3001` |

**Como descobrir o IP local do Windows:**
```
ipconfig
# procure por "Endereço IPv4" — ex: 192.168.1.100
```

**Como instalar no iPhone:**

1. Abra o link acima no **Safari** (não funciona no Chrome do iPhone)
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima, na barra inferior)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**

O Personal OS aparece como app nativo na sua tela, com ícone próprio e sem barra do navegador. Funciona offline para tarefas e IA (com cache).

> **Dica:** Use o Tailscale para acessar de qualquer lugar — mesmo no 4G, sem precisar estar na mesma rede do computador.

---

## Comandos WhatsApp

Mande mensagem para você mesmo no WhatsApp. O bot responde instantaneamente.

| Mensagem | Resposta |
|---|---|
| `agenda` | Compromissos de hoje com horário |
| `amanha` | Compromissos de amanhã |
| `briefing` | Resumo do dia gerado pela IA |
| `tarefas` | Lista de tarefas pendentes por prioridade |
| `tarefa Ligar para o fornecedor` | Cria uma nova tarefa |
| `lembrar 15:30 Buscar os filhos` | Cria lembrete para às 15:30 |
| `saldo` | Saldo total de todas as contas |
| `extrato` | Resumo financeiro do mês + top categorias |
| `gasto 50 mercado` | Registra um gasto de R$50 em "mercado" |
| `receita 1000 salário` | Registra uma entrada de R$1000 |
| `metas` | Progresso das metas de economia |
| `ajuda` | Mostra todos os comandos |
| *qualquer outra mensagem* | Resposta da IA com contexto |

---

## Usando no iPhone — passo a passo completo

### Requisitos
- O **computador Windows precisa estar ligado e com o Personal OS rodando**
- iPhone e computador na mesma rede Wi-Fi (ou Tailscale para qualquer lugar)

---

### Passo 1 — Inicie o Personal OS no computador

Abra o Personal OS (ícone na Área de Trabalho, se você usou o instalador `.exe`) ou rode `npm run dev` no backend e no frontend (modo desenvolvedor — veja a seção "Início rápido" acima).
Aguarde aparecer nos logs:

```
🚀 Personal OS: http://localhost:3001
🔒 Tailscale:   http://100.x.x.x:3001
```

---

### Passo 2 — Conecte o WhatsApp no iPhone

Quando o terminal mostrar o QR code:

```
iPhone:  WhatsApp
         ↓
         Configurações (canto inferior direito)
         ↓
         Aparelhos Conectados
         ↓
         Conectar Aparelho
         ↓
         [escaneie o QR code do terminal]
```

Após conectar, você recebe: **"🤖 Personal OS online!"**  
A partir daí, mande `ajuda` para ver todos os comandos disponíveis.

---

### Passo 3 — Instale o dashboard como app

1. No iPhone, abra o **Safari**
2. Digite o endereço:
   - Mesma Wi-Fi: `http://192.168.x.x:5173` ← use o IP do seu computador
   - Tailscale: `http://100.x.x.x:3001` ← aparece no terminal
3. Aguarde a página carregar completamente
4. Toque no ícone **⬡** central na barra inferior do Safari (Compartilhar)
5. Role a lista até encontrar **"Adicionar à Tela de Início"**
6. Toque em **Adicionar**

O Personal OS agora aparece na sua tela de início como qualquer outro app. Ele abre em tela cheia, sem a barra do Safari.

---

### Usando o app no iPhone

| Gesto | Ação |
|---|---|
| Toque nas abas na parte de baixo | Navega entre Agenda, Tarefas, IA e Briefing |
| Deslize horizontalmente na tela | Também muda de aba |
| Toque no botão ⚡ | Abre menu rápido: nova tarefa, lembrete, IA |
| Puxe a lista para baixo | Atualiza os dados |

---

### Usando via WhatsApp (sem abrir o app)

Mande mensagem para **você mesmo** no WhatsApp. Atalhos rápidos:

```
agenda          → ver compromissos de hoje
amanha          → ver compromissos de amanhã
tarefas         → ver o que está pendente
tarefa [texto]  → criar tarefa nova
lembrar HH:MM [texto]  → criar lembrete
briefing        → pedir o resumo do dia
[qualquer coisa]→ a IA responde
```

---

## Acesso de qualquer lugar com Tailscale

O Tailscale cria uma rede privada entre seus dispositivos. Uma vez instalado, o iPhone acessa o dashboard do Personal OS como se estivesse na mesma Wi-Fi — mesmo no 4G, no trabalho ou viajando.

**Instalação:**

1. No Windows: [tailscale.com/download/windows](https://tailscale.com/download/windows) → instalar → fazer login
2. No iPhone: App Store → buscar **Tailscale** → instalar → login com a mesma conta
3. Abra o Personal OS normalmente (ele já escuta em `0.0.0.0:3001`, então o Tailscale enxerga sozinho) — descubra seu IP com `tailscale ip -4` no Windows

```
Computador  →  http://localhost:3001
iPhone      →  http://100.x.x.x:3001   ← via Tailscale, em qualquer rede
```

---

## Google Calendar (opcional)

Para sincronizar seus compromissos reais:

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Novo projeto → Ativar **Google Calendar API**
3. Credenciais → OAuth 2.0 → adicione `http://localhost:3001/api/auth/google/callback` como URI de redirecionamento
4. Copie o **Client ID** e **Client Secret** para o `.env`
5. Abra `http://localhost:3001/api/agenda/auth-url` no navegador e autorize
6. Envie o código recebido para `POST /api/agenda/exchange-code` e copie o `refresh_token` para o `.env`

Sem o Google Calendar, a agenda funciona como um espaço para criar eventos manualmente. As tarefas, IA, briefing e lembretes funcionam normalmente.

---

## Dashboard

O dashboard adapta a visualização conforme o dispositivo:

**Computador** — oito painéis simultâneos em grade:

```
┌───────────┬───────────┬───────────┬───────────┐
│ 🎯 Painel │ 📅 Agenda │ ✅Tarefas │ 💰Financ. │
├───────────┼───────────┼───────────┼───────────┤
│ 🤖IA Chat │ ☀️Briefing│ 💻Terminal│ 📊  Uso   │
└───────────┴───────────┴───────────┴───────────┘
```

**iPhone** — painel único com navegação por abas (rolagem horizontal se não couber tudo na tela) e **swipe horizontal** para trocar de seção. Botão ⚡ flutuante para ações rápidas (nova tarefa, lembrete, financeiro, terminal, IA). Botão 🎙️ no topo para comando de voz em qualquer tela.

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js · Express · SQLite (better-sqlite3) |
| IA | Claude (Anthropic SDK) · `claude-sonnet-4-6` |
| WhatsApp | whatsapp-web.js · Puppeteer |
| Agenda | Google Calendar API v3 · OAuth2 |
| Automação | node-cron |
| Frontend | React 18 · Vite 5 |
| Mobile | PWA · Workbox · `safe-area-inset` iOS |
| Rede privada | Tailscale (WireGuard) |
| Banco de dados | SQLite local — sem servidor externo |
| App de desktop | Electron + electron-builder (instalador NSIS) + electron-updater |
| Voz | Web Speech API (reconhecimento + síntese) |
| Tempo real | WebSocket nativo (`ws`) — um canal, todos os dispositivos |
| Visual | Liquid glass — superfícies translúcidas com `backdrop-filter` |

---

## Estrutura

```
personal-os/
├── SIRI-SHORTCUTS.md           ← guia do Atalho da Siri
├── ATUALIZACOES.md             ← como publicar uma nova versão
│
├── .github/workflows/
│   └── build-installer.yml     ← builda o instalador .exe no GitHub Actions
│
├── electron/                   ← empacota o dashboard como app Windows
│   ├── main.js                 ← janela + bandeja + auto-start + sobe o backend
│   └── package.json            ← config do electron-builder (NSIS)
│
├── backend/
│   └── src/
│       ├── index.js            ← servidor Express
│       ├── config/             ← variáveis de ambiente
│       ├── db/                 ← SQLite + schema
│       ├── services/
│       │   ├── whatsapp.js     ← bot + comandos (agenda/tarefas/financeiro)
│       │   ├── calendar.js     ← Google Calendar
│       │   ├── ai.js           ← Claude (chat + briefing)
│       │   ├── briefing.js     ← geração do resumo diário
│       │   ├── scheduler.js    ← cron jobs
│       │   └── realtime.js     ← WebSocket — sincroniza PC + iPhone na hora
│       └── routes/
│           ├── agenda.js
│           ├── tasks.js
│           ├── ai.js
│           ├── briefing.js
│           ├── reminders.js
│           ├── finance.js      ← contas, transações, orçamento, metas
│           ├── voice.js        ← comando de voz / Siri Shortcuts
│           ├── terminal.js     ← chat com Claude via SSE (streaming)
│           ├── diagnostics.js  ← captura + diagnóstico de erros
│           └── usage.js        ← estatísticas de tokens/custo
│
└── frontend/
    └── src/
        ├── App.jsx             ← layout + swipe + FAB
        ├── index.css           ← design system + breathing animations
        ├── services/
        │   ├── api.js          ← chamadas HTTP ao backend
        │   └── realtime.js     ← cliente WebSocket (reconexão automática)
        └── components/
            ├── Header.jsx      ← relógio + selo AO VIVO + botão de voz
            ├── DashboardPanel.jsx ← prioridades + gráficos de objetivos
            ├── AgendaPanel.jsx
            ├── TaskPanel.jsx
            ├── FinancePanel.jsx    ← área financeira
            ├── VoiceButton.jsx     ← mic (Web Speech API) + TTS
            ├── TerminalPanel.jsx   ← chat com Claude em tempo real (SSE)
            ├── UsagePanel.jsx      ← tokens e custo estimado
            ├── UpdateBanner.jsx    ← avisa quando existe versão nova
            ├── ErrorBoundary.jsx   ← isola falhas por painel + reporta erro
            ├── AIChat.jsx
            ├── BriefingPanel.jsx
            └── QuickModal.jsx  ← criação rápida mobile
```

---

<div align="center">

Roda no seu computador · Seus dados ficam com você

</div>
