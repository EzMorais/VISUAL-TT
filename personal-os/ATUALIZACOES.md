# Como lançar atualizações

O Personal OS tem dois canais de atualização — um para o **dashboard** (web/PWA/iPhone) e um para o **app de desktop** (Windows). Os dois usam o mesmo número de versão, guardado nos `package.json` de `backend/`, `frontend/` e `electron/`.

## 1 · Atualizando o dashboard (PC, iPhone, qualquer navegador)

Não existe "publicar" separado aqui — é o próprio backend rodando que serve a versão mais nova.

1. Edite o código normalmente.
2. Rode `cd frontend && npm run build` (gera os arquivos novos em `backend/public`).
3. Reinicie o backend (`node src/index.js`, ou reinicie o app de desktop).

A partir daí, qualquer tela aberta — computador ou iPhone — recebe um aviso automático:

- Assim que o navegador reconecta ao canal em tempo real (`/ws`), o backend informa sua versão.
- O dashboard compara com a versão que ele mesmo carregou e, se forem diferentes, mostra o banner **"🚀 Nova versão disponível"** com um botão **Atualizar**.
- Isso também é checado a cada 5 minutos via `GET /api/version`, então mesmo uma aba que nunca perdeu conexão acaba avisada.

Não precisa reinstalar nada no iPhone — é só tocar em "Atualizar" (recarrega a página, pega os arquivos novos).

## 2 · Atualizando o app de desktop (Windows)

O app de desktop (Electron) verifica atualizações sozinho a cada poucas horas, usando **GitHub Releases** como canal de distribuição — sem precisar reinstalar manualmente em cada computador. Não precisa de nenhum arquivo `.bat` nem Node.js na sua máquina: quem builda e publica é o **GitHub Actions**.

Passo a passo para publicar uma nova versão:

1. Suba a nova versão nos `package.json` de `backend/`, `frontend/` e `electron/` (mesmo número nos três).
2. Crie e envie uma tag no padrão `personal-os-vX.Y.Z`:
   ```bash
   git tag personal-os-v1.2.0
   git push origin personal-os-v1.2.0
   ```
   *(No repositório standalone `PESONAL-OS`, a tag é só `vX.Y.Z`, sem o prefixo.)*
3. O workflow **Build Installer** dispara sozinho, builda o instalador e publica como uma **Release** no GitHub — acompanhe em **Actions**.

A partir daí, **todo Personal OS instalado** verifica essa Release automaticamente. Quando encontra uma versão nova:

1. Baixa em segundo plano (não interrompe o uso).
2. Mostra um aviso na bandeja do sistema.
3. O ícone da bandeja ganha a opção **"⬇️ Reiniciar para atualizar"** — um clique aplica a atualização.

Também dá pra forçar a checagem na hora: ícone da bandeja → **"Verificar atualizações"**.

Quer só um `.exe` novo sem criar uma Release (por exemplo, pra testar)? Vá em **Actions → Build Installer → Run workflow** — builda e deixa o instalador disponível como artefato do próprio workflow, sem publicar nada.

## Resumo

| O quê | Como atualiza | Ação da pessoa |
|---|---|---|
| Dashboard (PC/iPhone/navegador) | `npm run build` + reiniciar o backend | Toca em "Atualizar" no banner |
| App de desktop (Windows) | `git push` de uma tag → GitHub Actions → GitHub Releases | Clica em "Reiniciar para atualizar" na bandeja |
