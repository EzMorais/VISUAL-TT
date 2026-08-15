# Comando de voz — Web + Siri

O Personal OS entende comandos de voz de duas formas:

1. **No dashboard** (PWA ou app instalado) — toque no botão 🎙️ no topo da tela e fale. Funciona em português no Safari do iPhone.
2. **Pela Siri** — usando o app **Atalhos** (Shortcuts) do iPhone, você pode dizer "Ei Siri, Personal OS" e falar um comando, sem nem abrir o app.

Os dois caminhos usam a mesma rota da API:

```
POST /api/voice/command
Content-Type: application/json

{ "command": "gastei 50 no mercado" }
```

Resposta:

```json
{ "response": "Registrado: gasto de R$ 50,00 com mercado.", "source": "finance" }
```

O texto em `response` é o que a Siri (ou a síntese de voz do navegador) fala de volta para você.

### Comandos que a rota entende diretamente (sem IA)

| Fala | Resultado |
|---|---|
| "saldo" | Lê o saldo total das suas contas |
| "extrato" | Resumo de entradas e saídas do mês |
| "gastei 50 com mercado" | Registra um gasto de R$50 em "mercado" |
| "recebi 1000 de salário" | Registra uma entrada de R$1000 |
| "tarefa ligar para o dentista" | Cria uma tarefa nova |

Qualquer outra frase (agenda, perguntas gerais, pedir um resumo do dia) cai automaticamente no fallback da IA (Claude), que responde como no chat.

---

## Configurando o Atalho da Siri

### Pré-requisito

O Personal OS precisa estar acessível a partir do iPhone — via Wi-Fi local ou, para funcionar em qualquer lugar, via **Tailscale** (veja o README principal). Anote o endereço que aparece no terminal ao rodar `start-tailscale.bat`, por exemplo:

```
http://100.x.x.x:3001
```

### Passo a passo

1. Abra o app **Atalhos** (Shortcuts) no iPhone.
2. Toque em **+** para criar um novo atalho.
3. Toque em **Adicionar Ação** → busque por **"Ditado de Texto"** (Dictate Text) → adicione.
   - Defina o idioma para **Português (Brasil)**.
4. Adicione a ação **"Obter Conteúdo de URL"** (Get Contents of URL):
   - **URL:** `http://100.x.x.x:3001/api/voice/command` (troque pelo seu IP do Tailscale)
   - **Método:** `POST`
   - **Cabeçalhos (Headers):** `Content-Type` → `application/json`
   - **Corpo da requisição (Request Body):** selecione **JSON** e adicione o campo `command` com o valor do **Texto Ditado** (resultado do passo 3)
5. Adicione a ação **"Obter Valor do Dicionário"** (Get Dictionary Value) com a chave `response`, apontando para o resultado da ação anterior.
6. Adicione a ação **"Falar Texto"** (Speak Text) usando o valor obtido no passo 5.
7. Toque no nome do atalho (topo) → renomeie para **"Personal OS"** → ative **"Mostrar no app Atalhos"** e **"Adicionar à Siri"**.
8. Grave a frase de ativação, por exemplo: **"Ei Siri, Personal OS"**.

Pronto — a partir de agora, basta dizer *"Ei Siri, Personal OS"*, falar o comando quando ela pedir, e ouvir a resposta em voz alta.

### Testando sem a Siri

Para confirmar que a rota está no ar antes de configurar o Atalho, teste pelo navegador do computador (ou `curl`):

```bash
curl -X POST http://localhost:3001/api/voice/command \
  -H "Content-Type: application/json" \
  -d '{"command":"saldo"}'
```

Se voltar um JSON com `"response"`, está tudo certo — só apontar o Atalho para o IP do Tailscale.
