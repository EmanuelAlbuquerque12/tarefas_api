@echo off
cls
color 0B
echo ========================================
echo    Abrir Dashboard ProJuris
echo ========================================
echo.

echo Abrindo dashboard no navegador...
start http://localhost:3000

echo.
echo Dashboard aberto!
echo.
echo NOTA: Se o servidor nao estiver rodando,
echo execute "iniciar.bat" primeiro.
echo.
timeout /t 3 /nobreak >nul
