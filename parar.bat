@echo off
cls
color 0C
echo ========================================
echo    Parar Dashboard ProJuris
echo ========================================
echo.

echo Procurando processos do Node.js...
echo.

:: Listar processos Node.js
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo Encerrando todos os processos Node.js...
    taskkill /F /IM node.exe >nul 2>&1
    echo Servidor parado com sucesso!
) else (
    echo Nenhum servidor em execucao
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
