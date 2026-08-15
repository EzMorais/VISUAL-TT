# Personal OS no Android

O dashboard já funciona no Android sem nenhuma configuração extra — na
verdade o Chrome tem suporte a PWA mais completo que o Safari do iPhone
(atalhos no ícone, por exemplo). O comando de voz pelo botão 🎙️ no topo
também funciona direto no Chrome Android.

O que o Android **não tem de fábrica** é o equivalente ao Atalho da Siri.
Este guia cobre isso com o **Tasker** (o app de automação mais usado e
flexível no Android — pago, ~R$20, compra única) — e uma alternativa
gratuita com o **MacroDroid**.

---

## Instalando o app (PWA)

1. Abra o endereço do Personal OS no **Chrome** (não no app do WhatsApp nem em outro navegador embutido).
2. Toque no menu **⋮** (três pontinhos, canto superior direito) → **Instalar app** (ou "Adicionar à tela inicial").
3. Confirme. O Personal OS aparece como app de verdade, com ícone próprio, sem barra do navegador.

**Atalhos rápidos:** segure o dedo no ícone do Personal OS na tela inicial — aparece um menu com **Terminal**, **Financeiro**, **Nova tarefa** e **Agenda**, indo direto pra aquela aba sem passar pela tela principal.

---

## Comando de voz com um toque (Tasker)

Isso cria um botão — na tela inicial, na barra de notificações, ou no ladrilho de configurações rápidas — que ouve sua voz, manda pro Claude, e fala a resposta de volta. Igual ao Atalho da Siri, só que sem precisar dizer uma frase de ativação primeiro (você toca, depois fala).

### Pré-requisito

O computador com o Personal OS rodando precisa estar acessível pelo celular — mesma Wi-Fi, ou **Tailscale** pra funcionar de qualquer lugar (veja o README principal). Anote o endereço, por exemplo `http://100.x.x.x:3001`.

### Passo a passo

1. Instale o **Tasker** ([Google Play](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm)).
2. Aba **Tasks** → **+** → dê um nome, ex: `Personal OS`.
3. Adicione as ações, nesta ordem:

   **① Ouvir sua voz**
   - `+` → **Input** → **Get Voice**
   - Idioma: `pt-BR`
   - Isso guarda o texto reconhecido na variável `%voice`

   **② Mandar pro Personal OS**
   - `+` → **Net** → **HTTP Request**
   - Method: `POST`
   - URL: `http://100.x.x.x:3001/api/voice/command` (troque pelo seu IP)
   - Headers: `Content-Type: application/json`
   - Body: `{"command": "%voice"}`
   - Isso guarda a resposta em `%http_data`

   **③ Extrair a resposta**
   - `+` → **Variables** → **Variable Set**
   - Name: `%reply`
   - To: `%http_data` → toque no botão de função ao lado do campo → **JavaScriptlet** (ou use **Parse/Format JSON**, dependendo da versão do Tasker) com:
     ```js
     JSON.parse(http_data).response
     ```

   **④ Falar a resposta**
   - `+` → **Alert** → **Say**
   - Text: `%reply`
   - Idioma: `pt-BR`

4. Toque em **◀** para salvar a Task.

### Colocando um botão pra disparar

Escolha uma (ou várias):

- **Widget na tela inicial:** segure o dedo na tela inicial → Widgets → Tasker → arraste o widget **Task** → escolha `Personal OS`.
- **Ladrilho nas Configurações Rápidas:** puxe a barra de notificações duas vezes → ✏️ (editar) → arraste o ladrilho **Tasker** → nas configurações do Tasker, associe esse ladrilho à Task `Personal OS`.
- **Ícone flutuante / gesto:** Tasker → **Profiles** → `+` → **Event** → escolha o gatilho que preferir (gesto na tela, botão de volume segurado, etc.) → associe à Task `Personal OS`.

### Upgrade: ativar por voz, sem tocar em nada

Pra chegar no equivalente exato de "Ei Siri, Personal OS" (falar a frase de ativação sem tocar na tela), instale o plugin **[AutoVoice](https://play.google.com/store/apps/details?id=com.joaomgcd.autovoice)** e defina-o como o **app assistente padrão** do Android (Configurações → Apps → Apps padrão → App de assistência digital). O AutoVoice te deixa configurar uma frase de comando que dispara a Task do Tasker direto, sem precisar abrir nada primeiro.

---

## Alternativa gratuita: MacroDroid

Mesma ideia, sem custo (com algumas limitações na versão grátis):

1. Instale o **[MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)**.
2. Crie uma **Macro** nova.
3. **Trigger:** widget da tela inicial (ou notificação) → "Macro tapped".
4. **Actions**, nesta ordem:
   - **Speech Recognition** (Google) → guarda em uma variável, ex. `voice_text`
   - **HTTP GET/POST Request** → `POST` para `http://100.x.x.x:3001/api/voice/command`, corpo `{"command": "[voice_text]"}`, tipo `application/json`
   - **Text Manipulation** → extrai o campo `response` do JSON retornado (MacroDroid tem uma ação de "JSON Parse" nas versões recentes)
   - **Text To Speech** → fala o resultado

---

## Testando sem nenhum app de automação

Pra confirmar que a rota está no ar antes de configurar Tasker/MacroDroid:

```bash
curl -X POST http://100.x.x.x:3001/api/voice/command \
  -H "Content-Type: application/json" \
  -d '{"command":"saldo"}'
```

Se voltar `{"response": "..."}`, a rota está pronta — o resto é só apontar o app de automação escolhido pra ela.
