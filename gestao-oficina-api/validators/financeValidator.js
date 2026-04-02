const { z } = require('zod');
const { uuid } = require('./common');

/**
 * Esquemas de Validação para Transações Financeiras
 */
const financeSchemas = {
    /**
     * Esquema para criação de nova transação (Receita ou Despesa)
     */
    create: z.object({
        type: z.enum(['income', 'expense'], { required_error: "Tipo é obrigatório (income/expense)" }),
        description: z.string().min(3, "Descrição muito curta").max(255),
        category: z.string().min(2, "Categoria é obrigatória").max(100),
        amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
        payment_date: z.string().nullable().optional(),
        date: z.string().nullable().optional(), // Alias para compatibilidade
        status: z.enum(['pendente', 'pago', 'cancelado']).default('pendente'),
        payment_method: z.string().nullable().optional(),
        os_id: z.string().uuid().nullable().optional() // Suporta UUID se vinculado a uma OS
    }),

    /**
     * Esquema para atualização parcial de transação
     */
    update: z.object({
        type: z.enum(['income', 'expense']).optional(),
        description: z.string().min(3).max(255).optional(),
        category: z.string().min(2).max(100).optional(),
        amount: z.coerce.number().min(0.01).optional(),
        payment_date: z.string().nullable().optional(),
        date: z.string().nullable().optional(), // Alias para compatibilidade
        status: z.enum(['pendente', 'pago', 'cancelado']).optional(),
        payment_method: z.string().nullable().optional(),
        os_id: z.string().uuid().nullable().optional()
    }).partial()
};

module.exports = financeSchemas;
