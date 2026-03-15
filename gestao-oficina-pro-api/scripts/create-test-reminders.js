const db = require('../config/database');

async function createTestData() {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const data = [
            {
                type: 'income',
                category: 'Serviço',
                amount: 1500.00,
                description: 'Pagamento Vencido - OS #10',
                payment_date: yesterday.toISOString().split('T')[0],
                status: 'pendente'
            },
            {
                type: 'expense',
                category: 'Peças',
                amount: 450.00,
                description: 'Fornecedor de Óleo - Vencimento Amanhã',
                payment_date: tomorrow.toISOString().split('T')[0],
                status: 'pendente'
            },
            {
                type: 'expense',
                category: 'Luz',
                amount: 320.00,
                description: 'Conta de Energia',
                payment_date: today.toISOString().split('T')[0],
                status: 'pendente'
            }
        ];

        for (const item of data) {
            await db.query(
                'INSERT INTO transactions (type, category, amount, description, payment_date, status) VALUES (?, ?, ?, ?, ?, ?)',
                [item.type, item.category, item.amount, item.description, item.payment_date, item.status]
            );
        }

        console.log('✅ Dados de teste criados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error);
        process.exit(1);
    }
}

createTestData();
