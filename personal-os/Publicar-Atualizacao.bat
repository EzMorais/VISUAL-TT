@echo off
title Personal OS — Publicar atualizacao
color 0A

echo.
echo   ============================================
echo    Publica uma nova versao para TODO MUNDO
echo    que ja instalou o Personal OS no Windows.
echo   ============================================
echo.
echo   Isso builda o app, empacota o instalador e
echo   sobe como uma "Release" no GitHub. Os apps ja
echo   instalados detectam sozinhos e se atualizam
echo   (aparece um aviso na bandeja do sistema).
echo.

if "%GH_TOKEN%"=="" (
  echo   Preciso de um GH_TOKEN ^(GitHub Personal Access
  echo   Token, com permissao "repo"^) para publicar.
  echo.
  echo   Crie um em: https://github.com/settings/tokens
  echo.
  set /p GH_TOKEN="  Cole seu GH_TOKEN aqui e aperte Enter: "
)

if "%GH_TOKEN%"=="" (
  echo   Nenhum token informado. Cancelando.
  pause & exit /b 1
)

set ROOT=%~dp0
cd /d "%ROOT%"

echo.
set /p NEWVER="  Nova versao (ex: 1.2.0) — deixe em branco para manter a atual: "

if not "%NEWVER%"=="" (
  echo   Atualizando numero da versao para %NEWVER%...
  cd electron
  call npm version %NEWVER% --no-git-tag-version --allow-same-version
  cd ..
  cd backend
  call npm version %NEWVER% --no-git-tag-version --allow-same-version
  cd ..
  cd frontend
  call npm version %NEWVER% --no-git-tag-version --allow-same-version
  cd ..
)

if not exist "frontend\node_modules" ( cd frontend && call npm install --no-fund --no-audit && cd .. )
echo   Construindo o frontend...
cd frontend
call npm run build
if errorlevel 1 goto :erro
cd ..

if not exist "electron\node_modules" ( cd electron && call npm install --no-fund --no-audit && cd .. )

echo   Publicando no GitHub Releases...
cd electron
call npm run rebuild
if errorlevel 1 goto :erro
call npx electron-builder --win nsis --publish always
if errorlevel 1 goto :erro
cd ..

echo.
echo   ============================================
echo    Publicado! Os apps instalados vao encontrar
echo    essa versao sozinhos nas proximas horas
echo    ^(ou na hora, se a pessoa clicar em
echo    "Verificar atualizacoes" no icone da bandeja^).
echo   ============================================
echo.
pause
exit /b 0

:erro
echo.
echo   ERRO ao publicar. Veja a mensagem acima.
echo   Confirme que o GH_TOKEN tem permissao "repo".
echo.
pause
exit /b 1
