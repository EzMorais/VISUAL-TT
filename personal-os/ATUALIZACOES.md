# Como lançar atualizações

O Personal OS tem dois canais de atualização — um para o **dashboard** (web/PWA/iPhone) e um para o **app de desktop** (Windows). Os dois usam o mesmo número de versão, guardado nos `package.json` de `backend/`, `frontend/` e `electron/`.

## 1 · Atualizando o dashboard (PC, iPhone, qualquer navegador)

Não existe "publicar" separado aqui — é o próprio backend rodando que serve a versão mais nova.

1. Edite o código normalmente.
2. Rode `cd frontend && npm run build` (gera os arquivos novos em `backend/public`).
3. Reinicie o backend (`node src/index.js`, ou reinicie `start.bat` / `start-tailscale.bat` / o app de desktop).

A partir daí, qualquer tela aberta — computador ou iPhone — recebe um aviso automático:

- Assim que o navegador reconecta ao canal em tempo real (`/ws`), o backend informa sua versão.
- O dashboard compara com a versão que ele mesmo carregou e, se forem diferentes, mostra o banner **"🚀 Nova versão disponível"** com um botão **Atualizar**.
- Isso também é checado a cada 5 minutos via `GET /api/version`, então mesmo uma aba que nunca perdeu conexão acaba avisada.

Não precisa reinstalar nada no iPhone — é só tocar em "Atualizar" (recarrega a página, pega os arquivos novos).

## 2 · Atualizando o app de desktop (Windows)

O app de desktop (Electron) verifica atualizações sozinho a cada poucas horas, usando **GitHub Releases** como canal de distribuição — sem precisar reinstalar manualmente em cada computador.

Passo a passo para publicar uma nova versão:

1. Crie um **GitHub Personal Access Token** com permissão `repo`, em [github.com/settings/tokens](https://github.com/settings/tokens).
2. Rode `Publicar-Atualizacao.bat` na raiz do projeto.
3. Cole o token quando pedido.
4. Informe o novo número de versão (ex: `1.2.0`) — ou deixe em branco para manter o atual e só re-publicar.
5. O script builda o frontend, empacota o instalador e sobe como uma Release no GitHub.

A partir daí, **todo Personal OS instalado** (via `Instalar-Personal-OS.bat` ou pelo `.exe` gerado por `Criar-Instalador-Exe.bat`) verifica essa Release automaticamente. Quando encontra uma versão nova:

1. Baixa em segundo plano (não interrompe o uso).
2. Mostra um aviso na bandeja do sistema.
3. O ícone da bandeja ganha a opção **"⬇️ Reiniciar para atualizar"** — um clique aplica a atualização.

Também dá pra forçar a checagem na hora: ícone da bandeja → **"Verificar atualizações"**.

## Resumo

| O quê | Como atualiza | Ação da pessoa |
|---|---|---|
| Dashboard (PC/iPhone/navegador) | `npm run build` + reiniciar o backend | Toca em "Atualizar" no banner |
| App de desktop (Windows) | `Publicar-Atualizacao.bat` → GitHub Releases | Clica em "Reiniciar para atualizar" na bandeja |
