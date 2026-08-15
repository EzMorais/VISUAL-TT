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

</div>

---

## O que é o Personal OS?

Personal OS é um **assistente pessoal que roda no seu próprio computador** e te acompanha onde você estiver. Ele conecta sua agenda, suas tarefas e uma IA em um único sistema — acessível pelo dashboard no Windows, pelo iPhone como um app instalado, e pelo WhatsApp para acesso rápido sem abrir nada.

Você não depende de nenhum serviço externo pago. Tudo roda localmente, seus dados ficam com você, e o Tailscale mantém a conexão segura entre todos os dispositivos de qualquer lugar do mundo.

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

**Modo local** — mesma rede Wi-Fi:

```
start.bat
```

**Modo Tailscale** — de qualquer lugar, qualquer rede:

```
start-tailscale.bat
```

O script detecta seu IP do Tailscale, builda o frontend e sobe tudo em **uma porta única (3001)**.

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
| `ajuda` | Mostra todos os comandos |
| *qualquer outra mensagem* | Resposta da IA com contexto |

---

## Usando no iPhone — passo a passo completo

### Requisitos
- O **computador Windows precisa estar ligado e com o Personal OS rodando**
- iPhone e computador na mesma rede Wi-Fi (ou Tailscale para qualquer lugar)

---

### Passo 1 — Inicie o Personal OS no computador

Execute `start.bat` (mesma rede) ou `start-tailscale.bat` (qualquer lugar).  
Aguarde aparecer no terminal:

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
3. Execute **`start-tailscale.bat`** — ele detecta o IP automaticamente

```
Personal OS iniciado!

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

**Computador** — quatro painéis simultâneos em grade:

```
┌─────────────────┬─────────────────┐
│   📅  Agenda    │   🤖  IA Chat   │
│                 │                 │
├─────────────────┼─────────────────┤
│   ✅  Tarefas   │   ☀️  Briefing  │
│                 │                 │
└─────────────────┴─────────────────┘
```

**iPhone** — painel único com navegação por abas e **swipe horizontal** para trocar de seção. Botão ⚡ flutuante para ações rápidas (nova tarefa, lembrete, IA) sem sair da tela.

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

---

## Estrutura

```
personal-os/
├── start.bat                   ← iniciar (modo local)
├── start-tailscale.bat         ← iniciar (modo Tailscale)
│
├── backend/
│   └── src/
│       ├── index.js            ← servidor Express
│       ├── config/             ← variáveis de ambiente
│       ├── db/                 ← SQLite + schema
│       ├── services/
│       │   ├── whatsapp.js     ← bot + comandos
│       │   ├── calendar.js     ← Google Calendar
│       │   ├── ai.js           ← Claude (chat + briefing)
│       │   ├── briefing.js     ← geração do resumo diário
│       │   └── scheduler.js    ← cron jobs
│       └── routes/
│           ├── agenda.js
│           ├── tasks.js
│           ├── ai.js
│           ├── briefing.js
│           └── reminders.js
│
└── frontend/
    └── src/
        ├── App.jsx             ← layout + swipe + FAB
        ├── index.css           ← design system + breathing animations
        ├── services/api.js     ← chamadas ao backend
        └── components/
            ├── Header.jsx      ← relógio + status
            ├── AgendaPanel.jsx
            ├── TaskPanel.jsx
            ├── AIChat.jsx
            ├── BriefingPanel.jsx
            └── QuickModal.jsx  ← criação rápida mobile
```

---

<div align="center">

Roda no seu computador · Seus dados ficam com você

</div>
