@echo off
chcp 65001 >nul
cls
color 0A
echo ========================================
echo    Dashboard ProJuris - Iniciador
echo ========================================
echo.

:: Verificar se Node.js está instalado
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% encontrado
echo.

:: Verificar se npm está instalado
echo [2/5] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% encontrado
echo.

:: Verificar se node_modules existe
echo [3/5] Verificando dependências...
if not exist "node_modules\" (
    echo ⚙️  Instalando dependências pela primeira vez...
    echo    Isso pode levar alguns minutos...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas com sucesso!
) else (
    echo ✅ Dependências já instaladas
)
echo.

:: Verificar se .env existe
echo [4/5] Verificando configurações...
if not exist ".env" (
    color 0E
    echo ⚠️  Arquivo .env não encontrado!
    echo.
    echo Criando .env a partir do .env.example...
    copy .env.example .env >nul
    echo.
    echo ⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env
    echo    Localização: %CD%\.env
    echo.
    echo Deseja abrir o arquivo .env agora para configurar? (S/N)
    choice /c SN /n /m "Escolha: "
    if errorlevel 2 goto skip_env_edit
    if errorlevel 1 notepad .env
    :skip_env_edit
    echo.
)
echo ✅ Arquivo .env encontrado
echo.

:: Iniciar o servidor em background
echo [5/5] Iniciando servidor...
echo.
echo ┌─────────────────────────────────────────┐
echo │  Servidor ProJuris Dashboard            │
echo │  Porta: 3000                            │
echo │  URL: http://localhost:3000             │
echo └─────────────────────────────────────────┘
echo.
echo 🚀 Servidor iniciando...
echo    Aguarde alguns segundos...
echo.

:: Iniciar o servidor em uma nova janela
start "ProJuris Dashboard Server" cmd /k "npm start"

:: Aguardar 5 segundos para o servidor iniciar
timeout /t 5 /nobreak >nul

:: Abrir o navegador
echo 🌐 Abrindo navegador...
start http://localhost:3000

echo.
echo ✅ Tudo pronto!
echo.
echo 📊 Dashboard aberto em: http://localhost:3000
echo 📝 Logs do servidor: Verifique a outra janela do terminal
echo.
echo ─────────────────────────────────────────
echo Instruções:
echo   - Para parar o servidor: Feche a janela do servidor
echo   - Para recarregar: Pressione F5 no navegador
echo   - Para limpar cache: Use o botão no dashboard
echo ─────────────────────────────────────────
echo.
echo Pressione qualquer tecla para fechar este assistente
echo (O servidor continuará rodando em segundo plano)
pause >nul
