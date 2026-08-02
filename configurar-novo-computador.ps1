# VISUAL-TT: prepara um Windows do zero para abrir e rodar o projeto CSC-PAINEL.
#
# O que este script faz, em ordem:
#   1. Instala Node.js, Git, Visual Studio Code e GitHub CLI (se ainda nao tiver)
#   2. Instala o Claude Code (assistente de linha de comando)
#   3. Autentica no GitHub, se ainda nao estiver
#   4. Clona o repositorio privado CSC-PAINEL (se ainda nao tiver sido clonado)
#   5. Chama o script de instalacao que ja existe dentro do CSC-PAINEL, que termina o
#      trabalho: extensoes do VS Code, dependencias e banco de dados dos tres apps
#
# So texto sem acento neste arquivo, de proposito: Windows PowerShell 5.1 sem um BOM no
# arquivo le como ANSI da maquina, e um acento vira lixo que quebra o script no meio.
#
# Seguro rodar mais de uma vez: cada etapa confere se ja foi feita antes de tentar de novo.

$ErrorActionPreference = 'Stop'

$RepoConta = 'EzMorais'
$RepoNome = 'CSC-PAINEL'
$PastaDestino = Join-Path $env:USERPROFILE "Desktop\$RepoNome"

function Write-Titulo($texto) {
  Write-Host ""
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host " $texto" -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan
}

function Test-Comando($nome) {
  return [bool](Get-Command $nome -ErrorAction SilentlyContinue)
}

# Depois de um winget install, o PATH novo so existe no Registro -- esta janela nao sabe
# dele ate reabrir. Isto rele o PATH do Registro e atualiza a sessao atual, para nao
# precisar fechar e abrir o script de novo a cada programa instalado.
function Atualizar-Path {
  $maquina = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
  $usuario = [System.Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$maquina;$usuario"
}

function Instalar-Winget($id, $nomeAmigavel, $comandoParaConferir) {
  if (Test-Comando $comandoParaConferir) {
    Write-Host "  OK   $nomeAmigavel ja esta instalado." -ForegroundColor Green
    return
  }
  Write-Host "  ...  Instalando $nomeAmigavel (pode levar alguns minutos)" -ForegroundColor Yellow
  winget install --id $id -e --accept-source-agreements --accept-package-agreements --silent
  Atualizar-Path
  if (Test-Comando $comandoParaConferir) {
    Write-Host "  OK   $nomeAmigavel instalado." -ForegroundColor Green
  } else {
    Write-Host "  !!   $nomeAmigavel foi instalado, mas ainda nao aparece nesta janela." -ForegroundColor Yellow
    Write-Host "       Feche esta janela, abra 'configurar-novo-computador.bat' de novo e rode de novo -- e seguro repetir." -ForegroundColor Yellow
  }
}

Write-Titulo "1/5 - Conferindo o Windows Package Manager (winget)"
if (-not (Test-Comando 'winget')) {
  Write-Host "  winget nao foi encontrado. Em um Windows 10/11 atualizado ele ja vem instalado." -ForegroundColor Red
  Write-Host "  Abra a Microsoft Store, procure por 'App Installer', instale, e rode este arquivo de novo." -ForegroundColor Red
  Read-Host "Aperte Enter para fechar"
  exit 1
}
Write-Host "  OK   winget encontrado." -ForegroundColor Green

Write-Titulo "2/5 - Instalando os programas necessarios"
Instalar-Winget 'OpenJS.NodeJS.LTS' 'Node.js (LTS)' 'node'
Instalar-Winget 'Git.Git' 'Git' 'git'
Instalar-Winget 'Microsoft.VisualStudioCode' 'Visual Studio Code' 'code'
Instalar-Winget 'GitHub.cli' 'GitHub CLI' 'gh'
Atualizar-Path

Write-Titulo "3/5 - Instalando o Claude Code (assistente de linha de comando)"
if (Test-Comando 'claude') {
  Write-Host "  OK   Claude Code ja esta instalado." -ForegroundColor Green
} elseif (Test-Comando 'npm') {
  npm install -g '@anthropic-ai/claude-code'
  Atualizar-Path
  if (Test-Comando 'claude') {
    Write-Host "  OK   Claude Code instalado." -ForegroundColor Green
  } else {
    Write-Host "  !!   Instalei, mas 'claude' ainda nao aparece nesta janela. Reabra o script depois." -ForegroundColor Yellow
  }
} else {
  Write-Host "  !!   'npm' nao esta disponivel ainda -- pulando esta etapa. Rode o script de novo depois do Node instalar." -ForegroundColor Yellow
}

Write-Titulo "4/5 - Entrando no GitHub"
if (-not (Test-Comando 'gh')) {
  Write-Host "  !!   'gh' (GitHub CLI) nao esta disponivel nesta janela ainda." -ForegroundColor Red
  Write-Host "       Feche esta janela, abra 'configurar-novo-computador.bat' de novo para continuar." -ForegroundColor Red
  Read-Host "Aperte Enter para fechar"
  exit 1
}

$logado = $false
try {
  gh auth status 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $logado = $true }
} catch { $logado = $false }

if ($logado) {
  Write-Host "  OK   Ja esta logado no GitHub." -ForegroundColor Green
} else {
  Write-Host "  Voce vai precisar entrar com a conta do GitHub que tem acesso ao projeto." -ForegroundColor Yellow
  Write-Host "  Siga as instrucoes que vao aparecer abaixo (escolha GitHub.com, HTTPS, e" -ForegroundColor Yellow
  Write-Host "  'Login with a web browser')." -ForegroundColor Yellow
  Write-Host ""
  gh auth login
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  !!   Nao consegui confirmar o login. Rode este arquivo de novo pra tentar outra vez." -ForegroundColor Red
    Read-Host "Aperte Enter para fechar"
    exit 1
  }
}

Write-Titulo "5/5 - Baixando e instalando o projeto"
if (Test-Path $PastaDestino) {
  Write-Host "  OK   A pasta $PastaDestino ja existe -- nao baixei de novo." -ForegroundColor Green
} else {
  Write-Host "  Baixando $RepoConta/$RepoNome para $PastaDestino ..." -ForegroundColor Cyan
  gh repo clone "$RepoConta/$RepoNome" "$PastaDestino"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  !!   Nao consegui baixar o projeto. Confira sua internet e se a conta logada" -ForegroundColor Red
    Write-Host "       tem acesso ao repositorio $RepoConta/$RepoNome, e rode de novo." -ForegroundColor Red
    Read-Host "Aperte Enter para fechar"
    exit 1
  }
  Write-Host "  OK   Projeto baixado." -ForegroundColor Green
}

$scriptDoProjeto = Join-Path $PastaDestino 'configurar-novo-computador.bat'
if (Test-Path $scriptDoProjeto) {
  Write-Host ""
  Write-Host "  Entregando para o instalador do proprio projeto terminar (extensoes do VS Code," -ForegroundColor Cyan
  Write-Host "  dependencias e banco de dados dos tres apps)..." -ForegroundColor Cyan
  Write-Host ""
  & $scriptDoProjeto
} else {
  Write-Host "  !!   Nao encontrei configurar-novo-computador.bat dentro de $PastaDestino." -ForegroundColor Yellow
  Write-Host "       Abra essa pasta manualmente e siga o README.md ou o COMECE-AQUI.md de la." -ForegroundColor Yellow
  Read-Host "Aperte Enter para fechar"
}
