@echo off
title Personal OS

REM ── Verifica Node.js ──────────────────────────────────────
where node >nul 2>&1 || (
  echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

REM ── Instala dependencias se necessario ────────────────────
if not exist "backend\node_modules" (
  echo Instalando dependencias do backend...
  cd backend && npm install && cd ..
)

if not exist "frontend\node_modules" (
  echo Instalando dependencias do frontend...
  cd frontend && npm install && cd ..
)

REM ── Copia .env se nao existir ─────────────────────────────
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env"
  echo.
  echo IMPORTANTE: Edite o arquivo backend\.env com suas chaves antes de continuar!
  echo.
  pause
)

REM ── Inicia backend e frontend em janelas separadas ─────────
echo Iniciando Personal OS...
start "Personal OS — Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Personal OS — Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Personal OS iniciado!
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo No iPhone: abra http://SEU-IP:5173 no Safari e toque em
echo            Compartilhar → Adicionar à Tela de Inicio
echo.
pause
