@echo off
echo Démarrage du Live Server...
cd /d "%~dp0"
start http://localhost:8080
npm run live 