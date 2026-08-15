# ⬡ Personal OS

Ecossistema de assistente pessoal que automatiza seu dia inteiro.

**Computador (Windows):** Dashboard matrix com 4 painéis simultâneos  
**iPhone:** PWA instalável + bot no WhatsApp com comandos em português  
**Em qualquer lugar:** Acesso completo via internet

---

## O que faz

| Recurso | Como usar |
|---|---|
| 📅 Agenda | Sincroniza com Google Calendar, vê hoje e amanhã |
| ✅ Tarefas | Gerencia prioridades (alta/média/baixa) com data de vencimento |
| 🤖 IA | Chat com Claude para qualquer pergunta ou organização |
| ☀️ Briefing | Resumo matinal automático todo dia às 7h via WhatsApp |
| ⏰ Lembretes | Aviso automático 15 min antes de cada compromisso |
| 📱 WhatsApp | Controle tudo pelo celular sem abrir o app |

---

## Configuração rápida

### 1. Clone ou baixe o projeto

```
git clone https://github.com/EzMorais/visual-tt
cd visual-tt/personal-os
```

### 2. Configure as chaves

```
copy backend\.env.example backend\.env
```

Edite `backend\.env` e preencha:

```env
ANTHROPIC_API_KEY=sk-ant-...          # https://console.anthropic.com/
WHATSAPP_PHONE=5511999999999          # Seu número com DDI
TIMEZONE=America/Sao_Paulo
BRIEFING_HOUR=7
```

### 3. Inicie tudo

Dê duplo clique em **`start.bat`** ou rode:

```
cd backend && npm install && npm run dev
# (outra janela)
cd frontend && npm install && npm run dev
```

### 4. Conecte o WhatsApp

Quando o backend iniciar, aparece um **QR code no terminal**.  
No iPhone: **WhatsApp → Configurações → Aparelhos Conectados → Conectar aparelho** e escaneie.

Pronto! Mande **"ajuda"** para si mesmo no WhatsApp para ver todos os comandos.

### 5. Instale no iPhone como app

Abra `http://SEU-IP-LOCAL:5173` no **Safari** → toque em **Compartilhar** → **Adicionar à Tela de Início**.  
O Personal OS aparece como app nativo, funciona offline e recebe notificações.

---

## Comandos WhatsApp

| Comando | Ação |
|---|---|
| `agenda` | Agenda de hoje |
| `amanha` | Agenda de amanhã |
| `briefing` | Briefing do dia |
| `tarefas` | Tarefas pendentes |
| `tarefa Reunião com cliente` | Cria tarefa |
| `lembrar 14:30 Ligar para o banco` | Cria lembrete |
| Qualquer outra mensagem | Responde com IA |

---

## Google Calendar (opcional)

Para sincronizar a agenda real:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto → APIs → Google Calendar API → Credenciais → OAuth 2.0
3. Adicione `http://localhost:3001/api/auth/google/callback` como redirect URI
4. Cole `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`
5. Acesse `http://localhost:3001/api/agenda/auth-url` e autorize
6. Cole o código em `POST /api/agenda/exchange-code` e copie o `refresh_token` para o `.env`

---

## Estrutura do projeto

```
personal-os/
├── backend/          Node.js + Express + SQLite
│   └── src/
│       ├── services/ whatsapp · calendar · ai · briefing · scheduler
│       └── routes/   agenda · tasks · ai · briefing
└── frontend/         React + Vite + PWA
    └── src/
        └── components/ Header · Agenda · Tasks · AIChat · Briefing
```

---

## Tecnologias

- **Backend**: Node.js, Express, SQLite (better-sqlite3), node-cron
- **IA**: Claude (Anthropic SDK)
- **WhatsApp**: whatsapp-web.js (sem API paga)
- **Agenda**: Google Calendar API
- **Frontend**: React, Vite, PWA (installable no iOS/Android)
