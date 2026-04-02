const { z } = require('zod');
const { uuid } = require('./common');

const clientSchemas = {
    create: z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
        phone: z.string().max(20).nullable().optional(),
        email: z.string().email("E-mail inválido").nullable().optional(),
        document: z.string().max(20).nullable().optional(),
        address: z.string().max(255).nullable().optional(),
        notes: z.string().nullable().optional()
    }),
    update: z.object({
        name: z.string().min(3).max(100).optional(),
        phone: z.string().max(20).nullable().optional(),
        email: z.string().email().nullable().optional(),
        document: z.string().max(20).nullable().optional(),
        address: z.string().max(255).nullable().optional(),
        notes: z.string().nullable().optional()
    }).partial()
};

module.exports = clientSchemas;
