@echo off
echo Iniciando Gestão Oficina...

:: BACKEND
cd /d D:\GOOGLE\RUN_and_LOG\BKP\PROD\gestao-oficina-api
echo Iniciando backend...
start "BACKEND" cmd /k npm start

:: Comando	        O que faz	                        Porta
:: -------------------------------------------------------------
:: npm run dev	    Inicia servidor de desenvolvimento	5173
:: npm run build	Compila o projeto	                nenhuma
:: npm run preview	Simula produção	                    4173

:: FRONTEND
cd /d D:\GOOGLE\RUN_and_LOG\BKP\PROD\gestao-oficina

echo Gerando build do frontend...
call npm run build

echo Iniciando preview do frontend...
start "FRONTEND" cmd /k npm run preview

pause