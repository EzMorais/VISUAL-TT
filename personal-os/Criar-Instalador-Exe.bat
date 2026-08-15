@echo off
title Personal OS — Criar instalador .exe
color 0A

echo.
echo   ============================================
echo    Gera um instalador Personal-OS-Setup.exe
echo    para voce guardar, copiar para um pen drive
echo    ou subir no Google Drive e distribuir.
echo   ============================================
echo.
echo   Isso pode demorar alguns minutos na primeira vez
echo   (baixa o Electron e recompila o banco de dados
echo   nativo para o formato do app).
echo.
pause

where node >nul 2>&1 || (
  echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
  pause & exit /b 1
)

set ROOT=%~dp0
cd /d "%ROOT%"

if not exist "backend\node_modules"  ( cd backend  && call npm install --no-fund --no-audit && cd .. )
if not exist "frontend\node_modules" ( cd frontend && call npm install --no-fund --no-audit && cd .. )

echo   Construindo o frontend...
cd frontend
call npm run build
if errorlevel 1 goto :erro
cd ..

if not exist "electron\node_modules" ( cd electron && call npm install --no-fund --no-audit && cd .. )

echo   Empacotando o instalador (electron-builder)...
cd electron
call npm run dist
if errorlevel 1 goto :erro
cd ..

echo.
echo   ============================================
echo    Pronto! Seu instalador esta em:
echo    electron\dist\Personal OS Setup *.exe
echo   ============================================
echo.
echo   Envie esse arquivo .exe para o Google Drive,
echo   ou copie para qualquer outro computador —
echo   basta dar 2 cliques nele para instalar.
echo.
start "" "%ROOT%electron\dist"
pause
exit /b 0

:erro
echo.
echo   ERRO ao gerar o instalador. Veja a mensagem acima.
echo   Dica: rode Instalar-Personal-OS.bat primeiro para
echo   confirmar que tudo funciona antes de empacotar.
echo.
pause
exit /b 1
