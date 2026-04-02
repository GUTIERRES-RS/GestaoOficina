const { z } = require('zod');
const { uuid } = require('./common');

/**
 * Esquemas de Validação para Inventário (Peças e Estoque)
 */
const inventorySchemas = {
    /**
     * Esquema para criação de nova peça no estoque
     */
    create: z.object({
        name: z.string().min(2, "Nome é obrigatório").max(100),
        code: z.string().max(50).nullable().optional(),
        brand: z.string().max(50).nullable().optional(),
        description: z.string().max(255).nullable().optional(),
        category: z.string().max(50).nullable().optional(),
        supplier: z.string().max(100).nullable().optional(),
        cost_price: z.coerce.number().min(0, "Preço de custo não pode ser negativo"),
        sale_price: z.coerce.number().min(0, "Preço de venda não pode ser negativo"),
        stock_quantity: z.coerce.number().min(0).default(0),
        min_stock: z.coerce.number().min(0).default(0),
        unit: z.string().max(10).default('un')
    }),

    /**
     * Esquema para atualização parcial de peça
     */
    update: z.object({
        name: z.string().min(2).max(100).optional(),
        code: z.string().max(50).nullable().optional(),
        brand: z.string().max(50).nullable().optional(),
        description: z.string().max(255).nullable().optional(),
        category: z.string().max(50).nullable().optional(),
        supplier: z.string().max(100).nullable().optional(),
        cost_price: z.coerce.number().min(0).optional(),
        sale_price: z.coerce.number().min(0).optional(),
        stock_quantity: z.coerce.number().min(0).optional(),
        min_stock: z.coerce.number().min(0).optional(),
        unit: z.string().max(10).optional()
    }).partial(),

    /**
     * Esquema para ajuste rápido de estoque (entrada/saída)
     */
    adjust: z.object({
        quantity: z.coerce.number().gt(0, "Quantidade deve ser maior que zero"),
        type: z.enum(['entrada', 'saida'], { required_error: "Tipo de ajuste é obrigatório" }),
        obs: z.string().max(255).nullable().optional()
    })
};

module.exports = inventorySchemas;
