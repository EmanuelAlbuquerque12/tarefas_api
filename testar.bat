@echo off
cls
color 0B
echo ========================================
echo    Testar Conexao - ProJuris API
echo ========================================
echo.

echo Executando teste de conexao com a API ProJuris...
echo Este teste verificara:
echo    - Autenticacao OAuth2
echo    - Busca de tarefas
echo    - Integridade dos dados
echo.
echo -----------------------------------------
echo.

node test-connection.js

echo.
echo -----------------------------------------
echo.

if %errorlevel% neq 0 (
    color 0C
    echo ERRO: Teste falhou! Verifique as mensagens acima.
    echo.
    echo Possiveis solucoes:
    echo    1. Verifique o arquivo .env com suas credenciais
    echo    2. Confirme se tem acesso a internet
    echo    3. Verifique se as credenciais estao corretas
    echo.
) else (
    color 0A
    echo SUCESSO: Teste concluido!
    echo A integracao com ProJuris esta funcionando.
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
