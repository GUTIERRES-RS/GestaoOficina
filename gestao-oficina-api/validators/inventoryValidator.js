const { z } = require('zod');
const { uuid } = require('./common');

const inventorySchemas = {
    create: z.object({
        name: z.string().min(2).max(100),
        code: z.string().max(50).nullable().optional(),
        brand: z.string().max(50).nullable().optional(),
        cost_price: z.coerce.number().min(0),
        sale_price: z.coerce.number().min(0),
        stock_quantity: z.coerce.number().int().min(0).default(0),
        min_stock: z.coerce.number().int().min(0).default(0),
        category: z.string().max(50).nullable().optional(),
        unit: z.string().max(10).default('un')
    }),
    update: z.object({
        name: z.string().min(2).max(100).optional(),
        code: z.string().max(50).nullable().optional(),
        brand: z.string().max(50).nullable().optional(),
        cost_price: z.coerce.number().min(0).optional(),
        sale_price: z.coerce.number().min(0).optional(),
        stock_quantity: z.coerce.number().int().min(0).optional(),
        min_stock: z.coerce.number().int().min(0).optional(),
        category: z.string().max(50).nullable().optional(),
        unit: z.string().max(10).optional()
    }).partial()
};

module.exports = inventorySchemas;
