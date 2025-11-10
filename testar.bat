@echo off
chcp 65001 >nul
cls
color 0B
echo ========================================
echo    Testar Conexão - ProJuris API
echo ========================================
echo.

echo 🧪 Executando teste de conexão com a API ProJuris...
echo    Este teste verificará:
echo    - Autenticação OAuth2
echo    - Busca de tarefas
echo    - Integridade dos dados
echo.
echo ─────────────────────────────────────────
echo.

node test-connection.js

echo.
echo ─────────────────────────────────────────
echo.

if %errorlevel% neq 0 (
    color 0C
    echo ❌ Teste falhou! Verifique as mensagens acima.
    echo.
    echo 💡 Possíveis soluções:
    echo    1. Verifique o arquivo .env com suas credenciais
    echo    2. Confirme se tem acesso à internet
    echo    3. Verifique se as credenciais estão corretas
    echo.
) else (
    color 0A
    echo ✅ Teste concluído com sucesso!
    echo    A integração com ProJuris está funcionando.
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
