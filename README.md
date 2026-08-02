# VISUAL-TT

Um único arquivo que prepara um computador Windows do zero para abrir e rodar o projeto
[CSC-PAINEL](https://github.com/EzMorais/CSC-PAINEL) (repositório privado — precisa de uma
conta GitHub com acesso a ele).

Este repositório aqui é público e não tem nenhum código do projeto — só o instalador.

---

## Como usar

Não precisa instalar nada antes, nem ter Git ou conta logada. Esses dois passos bastam:

### 1. Baixar este repositório

1. Nesta página, clique no botão verde **Code**
2. Clique em **Download ZIP**
3. Extraia o ZIP para uma pasta de verdade — por exemplo, botão direito no arquivo baixado
   → **Extrair Tudo** → escolha `C:\VISUAL-TT`

> Não dê duplo clique no `.bat` de dentro do ZIP ainda fechado. O Windows abre o ZIP numa
> pasta temporária que ele apaga depois, e a instalação se perde. Extraia primeiro.

### 2. Rodar o instalador

1. Abra a pasta extraída
2. Dê duplo clique em **`configurar-novo-computador.bat`**
3. Uma janela azul do **Controle de Conta de Usuário** do Windows pode aparecer perguntando
   se o programa pode fazer alterações no dispositivo — clique **Sim**. É esperado: instalar
   programas exige essa permissão.
4. Em algum momento o script vai pedir pra você entrar com sua conta do GitHub — ele mostra
   um código e abre o navegador. Seguem as instruções na tela: escolha **GitHub.com**,
   **HTTPS**, e **Login with a web browser**.

   > A conta usada aqui precisa ter acesso ao repositório privado `EzMorais/CSC-PAINEL`.
   > Sem acesso, o download do projeto falha nessa etapa.

5. Depois do login, o script baixa o projeto sozinho para `Desktop\CSC-PAINEL` e continua a
   instalação automaticamente — dependências, banco de dados dos três sistemas e extensões
   do VS Code.
6. A janela preta **não fecha sozinha** — quando tudo terminar, ela pede para apertar Enter.

A primeira vez demora — pode passar de 15 minutos, dependendo da internet. Se alguma etapa
falhar no meio (queda de internet, por exemplo), **é seguro rodar o arquivo de novo**: cada
passo confere se já foi feito antes de repetir.

---

## O que o script instala

| Programa | Para que serve |
|---|---|
| Node.js (LTS) | Roda os três sistemas |
| Git | Controle de versão |
| Visual Studio Code | Editor de código |
| GitHub CLI (`gh`) | Login e download do projeto privado |
| [Claude Code](https://claude.com/claude-code) | Assistente de IA usado para construir e manter o projeto |
| Extensões do VS Code | Prisma, ESLint, Tailwind CSS IntelliSense, GitLens, Error Lens, SQLTools, Path Intellisense — definidas dentro do próprio projeto, em `.vscode/extensions.json` |

Depois de tudo instalado, o VS Code abre sozinho já na pasta do projeto. Pra aprender a
**usar** cada sistema (login, primeiros passos), veja o `README.md` ou o `COMECE-AQUI.md`
dentro da pasta `CSC-PAINEL` que foi baixada.

---

## Problemas comuns

**"winget não foi encontrado"**
Só acontece em Windows desatualizado. Abra a Microsoft Store, procure por "App Installer",
instale, e rode o `.bat` de novo.

**A janela fecha sozinha muito rápido, sem dar tempo de ler**
Abra o Prompt de Comando (tecla Windows → digite `cmd` → Enter), arraste o arquivo
`configurar-novo-computador.bat` pra dentro da janela e aperte Enter — assim a janela fica
aberta mesmo se algo falhar logo no início.

**"gh: command not found" logo depois de instalar**
O Windows só atualiza o PATH desta janela depois de reaberta. Feche e rode o `.bat` de novo
— é seguro repetir, ele pula o que já foi feito.

**Quero rodar de novo do zero**
Apague a pasta `Desktop\CSC-PAINEL` e rode o `.bat` de novo.
