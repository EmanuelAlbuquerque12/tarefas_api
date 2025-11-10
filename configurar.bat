@echo off
cls
color 0E
echo ========================================
echo    Configuracao - Dashboard ProJuris
echo ========================================
echo.

echo Este assistente ajudara voce a configurar o Dashboard.
echo.
echo -----------------------------------------
echo.

:: Menu principal
:menu
echo Escolha uma opcao:
echo.
echo [1] Editar credenciais da API (.env)
echo [2] Reinstalar dependencias
echo [3] Limpar cache e node_modules
echo [4] Verificar instalacao do Node.js
echo [5] Abrir documentacao (README)
echo [6] Abrir pasta do projeto
echo [0] Sair
echo.
choice /c 1234560 /n /m "Opcao: "

if errorlevel 7 goto end
if errorlevel 6 goto open_folder
if errorlevel 5 goto open_readme
if errorlevel 4 goto check_node
if errorlevel 3 goto clean_all
if errorlevel 2 goto reinstall
if errorlevel 1 goto edit_env

:edit_env
cls
echo Editando arquivo .env...
echo.
if not exist ".env" (
    echo Arquivo .env nao existe. Criando a partir do exemplo...
    copy .env.example .env >nul
)
notepad .env
echo.
echo Arquivo salvo!
echo.
pause
goto menu

:reinstall
cls
echo Reinstalando dependencias...
echo.
echo Removendo node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
echo.
echo Instalando novamente...
call npm install
echo.
if %errorlevel% equ 0 (
    echo Dependencias reinstaladas com sucesso!
) else (
    echo ERRO: Falha ao reinstalar dependencias
)
echo.
pause
goto menu

:clean_all
cls
echo Limpando cache e dependencias...
echo.
echo Voce perdera:
echo   - node_modules (sera necessario reinstalar)
echo   - Cache do npm
echo.
echo Deseja continuar? (S/N)
choice /c SN /n /m "Escolha: "
if errorlevel 2 goto menu

echo.
echo Limpando...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
call npm cache clean --force
echo.
echo Limpeza concluida!
echo Execute "iniciar.bat" para reinstalar
echo.
pause
goto menu

:check_node
cls
echo Verificando instalacao do Node.js...
echo.
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao instalado!
    echo Download: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo Node.js %NODE_VERSION%
)
echo.
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm nao instalado!
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo npm %NPM_VERSION%
)
echo.
echo Localizacao: %CD%
echo.
pause
goto menu

:open_readme
cls
echo Abrindo documentacao...
if exist "README.md" (
    start notepad README.md
) else (
    echo README.md nao encontrado
    pause
)
goto menu

:open_folder
cls
echo Abrindo pasta do projeto...
explorer .
goto menu

:end
echo.
echo Ate logo!
timeout /t 2 /nobreak >nul
