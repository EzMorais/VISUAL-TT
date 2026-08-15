@echo off
setlocal enabledelayedexpansion
title Personal OS — Instalador
color 0A

echo.
echo   ============================================
echo     PERSONAL OS  —  Instalador de 1 clique
echo   ============================================
echo.
echo   Isso vai instalar o Personal OS como um app
echo   de verdade no seu computador: icone na area
echo   de trabalho, inicia sozinho com o Windows.
echo.

REM ── Verifica Node.js ──────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo   ERRO: Node.js nao encontrado.
  echo.
  echo   1. Baixe e instale em: https://nodejs.org  (versao LTS)
  echo   2. Depois de instalar, rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)
echo   [OK] Node.js encontrado.

set ROOT=%~dp0
cd /d "%ROOT%"

REM ── Instala dependencias ──────────────────────────────────
echo.
echo   Instalando backend...
cd backend
call npm install --no-fund --no-audit
if errorlevel 1 goto :erro
cd ..

echo   Instalando frontend...
cd frontend
call npm install --no-fund --no-audit
if errorlevel 1 goto :erro

echo   Construindo o app (build de producao)...
call npm run build
if errorlevel 1 goto :erro
cd ..

echo   Instalando o app de desktop (Electron)...
cd electron
call npm install --no-fund --no-audit
if errorlevel 1 goto :erro
cd ..

REM ── Configura .env se necessario ──────────────────────────
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo.
  echo   IMPORTANTE: preencha suas chaves no arquivo que vai abrir
  echo   ^(ANTHROPIC_API_KEY e WHATSAPP_PHONE, no minimo^).
  echo   Salve e feche o Bloco de Notas para continuar.
  echo.
  pause
  notepad "backend\.env"
)

REM ── Cria atalho na Area de Trabalho + Menu Iniciar ────────
echo.
echo   Criando atalhos...

set ELECTRON_BIN=%ROOT%electron\node_modules\.bin\electron.cmd
set DESKTOP_LNK=%USERPROFILE%\Desktop\Personal OS.lnk
set STARTMENU_LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Personal OS.lnk
set STARTUP_LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Personal OS.lnk

powershell -NoProfile -Command ^
  "$s = (New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP_LNK%');" ^
  "$s.TargetPath = '%ELECTRON_BIN%';" ^
  "$s.Arguments = '.';" ^
  "$s.WorkingDirectory = '%ROOT%electron';" ^
  "$s.Description = 'Personal OS';" ^
  "$s.Save()"

copy "%DESKTOP_LNK%" "%STARTMENU_LNK%" >nul
copy "%DESKTOP_LNK%" "%STARTUP_LNK%" >nul

echo   [OK] Atalho criado na Area de Trabalho.
echo   [OK] Atalho criado no Menu Iniciar.
echo   [OK] Personal OS vai abrir sozinho quando o Windows ligar.

echo.
echo   ============================================
echo     Instalacao concluida!
echo   ============================================
echo.
echo   Abrindo o Personal OS agora...
echo   (na primeira vez, um QR code do WhatsApp pode
echo    aparecer nos logs — icone da bandeja, botao
echo    direito, "Ver logs (QR Code do WhatsApp)")
echo.

start "" "%DESKTOP_LNK%"

echo   Dica: rode start-tailscale.bat para acessar
echo   este painel de qualquer lugar pelo iPhone.
echo.
pause
exit /b 0

:erro
echo.
echo   ERRO durante a instalacao. Veja a mensagem acima.
echo.
pause
exit /b 1
