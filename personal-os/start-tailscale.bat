@echo off
title Personal OS — Tailscale
color 0A

echo.
echo  ==========================================
echo   Personal OS — Modo Tailscale
echo  ==========================================
echo.

REM ── Verifica Node.js ──────────────────────────────────────
where node >nul 2>&1 || (
  echo ERRO: Node.js nao encontrado.
  echo Instale em: https://nodejs.org
  pause & exit /b 1
)

REM ── Pega IP do Tailscale ──────────────────────────────────
for /f "tokens=*" %%i in ('tailscale ip -4 2^>nul') do set TSIP=%%i

if "%TSIP%"=="" (
  echo ERRO: Tailscale nao encontrado ou nao conectado.
  echo.
  echo  1. Instale em: https://tailscale.com/download/windows
  echo  2. Faca login e conecte
  echo  3. Rode este script novamente
  echo.
  pause & exit /b 1
)

echo  Tailscale IP detectado: %TSIP%
echo.

REM ── Instala dependencias se necessario ────────────────────
if not exist "backend\node_modules" (
  echo  Instalando dependencias do backend...
  cd backend && npm install --silent && cd ..
)
if not exist "frontend\node_modules" (
  echo  Instalando dependencias do frontend...
  cd frontend && npm install --silent && cd ..
)

REM ── Copia .env se nao existir ─────────────────────────────
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo.
  echo  IMPORTANTE: Edite backend\.env com suas chaves antes de continuar!
  echo  Especialmente ANTHROPIC_API_KEY e WHATSAPP_PHONE.
  echo.
  notepad "backend\.env"
  pause
)

REM ── Grava IP do Tailscale no .env ─────────────────────────
REM Remove linha antiga e adiciona nova
set TMPFILE=%TEMP%\pos_env_tmp.txt
findstr /v "^TAILSCALE_IP=" backend\.env > %TMPFILE%
echo TAILSCALE_IP=%TSIP% >> %TMPFILE%
move /y %TMPFILE% backend\.env >nul

REM ── Build do frontend com URL do Tailscale ────────────────
echo  Construindo frontend...
set VITE_API_URL=http://%TSIP%:3001/api
cd frontend && npm run build 2>&1 | findstr /v "^$"
if errorlevel 1 (
  cd ..
  echo.
  echo ERRO no build do frontend. Verifique os erros acima.
  pause & exit /b 1
)
cd ..

echo.
echo  ==========================================
echo   Tudo pronto! Iniciando servidor...
echo  ==========================================
echo.
echo  Acesse de QUALQUER LUGAR com Tailscale:
echo.
echo    Computador : http://localhost:3001
echo    iPhone     : http://%TSIP%:3001
echo.
echo  Para instalar no iPhone como app:
echo    Safari -^> http://%TSIP%:3001 -^> Compartilhar
echo    -^> Adicionar a Tela de Inicio
echo.
echo  WhatsApp: escaneie o QR code abaixo
echo  ==========================================
echo.

cd backend && set TAILSCALE_IP=%TSIP% && node src/index.js
