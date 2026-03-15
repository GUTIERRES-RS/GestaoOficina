require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        // 1. Connect without database to create it if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true // critical for running SQL scripts
        });

        console.log('✅ Conectado ao MySQL com sucesso!');

        // 2. Read SQL file
        const sqlPath = path.join(__dirname, '../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 3. Execute script
        console.log('⏳ Criando banco de dados e tabelas...');
        await connection.query(sql);

        console.log('🎉 Banco de dados inicializado com sucesso!');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro ao inicializar o banco de dados:', error.message);
        process.exit(1);
    }
}

initDB();
