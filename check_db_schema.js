const db = require('./gestao-oficina-api/config/database');
const fs = require('fs');

async function checkSchema() {
    try {
        const tables = ['service_orders', 'transactions', 'os_parts', 'inventory_movements', 'inventory'];
        let output = '';
        for (const table of tables) {
            output += `\n--- Schema for ${table} ---\n`;
            const [rows] = await db.query(`DESCRIBE ${table}`);
            output += JSON.stringify(rows, null, 2) + '\n';
        }
        fs.writeFileSync('d:/GOOGLE/GestaoOficina/schema_output.json', output);
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
