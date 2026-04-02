const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestao_oficina_pro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('--- Finalizando Migração UUID ---');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'clients', 'inventory', 'mechanics', 'users', 'settings',
            'vehicles', 'service_orders', 'os_parts', 'inventory_movements', 'transactions'
        ];

        // 1. Garantir que todas as tabelas têm uuid populado
        for (const table of tables) {
            await connection.query(`UPDATE \`${table}\` SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = ''`);
        }

        // 2. Garantir que todas as referências UUID estão populadas
        // Já fizemos para transactions.os_uuid.
        // Já vimos que vehicles.client_id, service_orders.client_id etc são CHAR(36).
        
        // 3. Remover todas as FKs antigas de vez
        console.log('Removendo chaves estrangeiras...');
        for (const table of tables) {
            const [fks] = await connection.query(`
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`, 
                [process.env.DB_NAME, table]
            );
            for (const fk of fks) {
                await connection.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``).catch(() => {});
            }
        }

        // 4. Limpar colunas redundantes (como client_uuid em vehicles)
        console.log('Limpando colunas redundantes...');
        await connection.query('ALTER TABLE vehicles DROP COLUMN IF EXISTS client_uuid').catch(() => {});
        await connection.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS client_uuid').catch(() => {});
        await connection.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS vehicle_uuid').catch(() => {});
        await connection.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS mechanic_uuid').catch(() => {});
        await connection.query('ALTER TABLE os_parts DROP COLUMN IF EXISTS os_uuid').catch(() => {});
        await connection.query('ALTER TABLE os_parts DROP COLUMN IF EXISTS part_uuid').catch(() => {});
        await connection.query('ALTER TABLE inventory_movements DROP COLUMN IF EXISTS part_uuid').catch(() => {});
        // Manual fix for transactions
        await connection.query('ALTER TABLE transactions DROP COLUMN IF EXISTS os_id').catch(() => {});
        await connection.query('ALTER TABLE transactions CHANGE COLUMN os_uuid os_id CHAR(36)').catch(() => {});

        // 5. Converter IDs primários
        console.log('Convertendo IDs primários...');
        for (const table of tables) {
            const [idCol] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'id'`);
            if (idCol.length > 0 && idCol[0].Type.toLowerCase().includes('int')) {
                await connection.query(`ALTER TABLE \`${table}\` MODIFY id INT NOT NULL`);
                await connection.query(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`).catch(() => {});
                await connection.query(`ALTER TABLE \`${table}\` DROP COLUMN id`);
                await connection.query(`ALTER TABLE \`${table}\` CHANGE COLUMN uuid id CHAR(36) NOT NULL`);
                await connection.query(`ALTER TABLE \`${table}\` ADD PRIMARY KEY (id)`);
            }
        }

        // 6. Recriar FKs
        console.log('Recriando chaves estrangeiras...');
        await connection.query(`ALTER TABLE vehicles ADD CONSTRAINT fk_veh_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE service_orders ADD CONSTRAINT fk_so_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE service_orders ADD CONSTRAINT fk_so_vehicles FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE service_orders ADD CONSTRAINT fk_so_mechanics FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL`).catch(() => {});
        await connection.query(`ALTER TABLE os_parts ADD CONSTRAINT fk_osp_so FOREIGN KEY (os_id) REFERENCES service_orders(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE os_parts ADD CONSTRAINT fk_osp_inv FOREIGN KEY (part_id) REFERENCES inventory(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE inventory_movements ADD CONSTRAINT fk_invm_inv FOREIGN KEY (part_id) REFERENCES inventory(id) ON DELETE CASCADE`).catch(() => {});
        await connection.query(`ALTER TABLE transactions ADD CONSTRAINT fk_trans_so FOREIGN KEY (os_id) REFERENCES service_orders(id) ON DELETE CASCADE`).catch(() => {});

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('--- Migração FINAL concluída! ---');

    } catch (error) {
        console.error('Erro:', error);
        if (connection) await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
