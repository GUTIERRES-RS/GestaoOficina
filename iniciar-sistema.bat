@echo off
echo Iniciando sistema de gestao da oficina...

cd /d D:\GOOGLE\WORKs\gestao-oficina-pro-api

echo Iniciando backend...
start cmd /k npm start

cd /d D:\GOOGLE\WORKs\gestao-oficina-pro

echo Iniciando frontend...
start cmd /k npm run dev

pause