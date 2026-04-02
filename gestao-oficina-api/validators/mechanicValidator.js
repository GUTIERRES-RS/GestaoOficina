const { z } = require('zod');
const { uuid } = require('./common');

/**
 * Esquemas de Validação para Mecânicos
 */
const mechanicSchemas = {
    /**
     * Esquema para cadastro de novo mecânico
     */
    create: z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
        phone: z.string().max(20).nullable().optional(),
        document: z.string().max(20).nullable().optional(),
        specialty: z.string().max(100).nullable().optional(),
        commission_rate: z.coerce.number().min(0, "Comissão não pode ser negativa").max(100, "Comissão máxima de 100%").default(0),
        status: z.enum(['Ativo', 'Inativo', 'Afastado']).default('Ativo'),
        hire_date: z.string().nullable().optional(),
        notes: z.string().max(500).nullable().optional()
    }),

    /**
     * Esquema para atualização parcial de dados do mecânico
     */
    update: z.object({
        name: z.string().min(3).max(100).optional(),
        phone: z.string().max(20).nullable().optional(),
        document: z.string().max(20).nullable().optional(),
        specialty: z.string().max(100).nullable().optional(),
        commission_rate: z.coerce.number().min(0).max(100).optional(),
        status: z.enum(['Ativo', 'Inativo', 'Afastado']).optional(),
        hire_date: z.string().nullable().optional(),
        notes: z.string().max(500).nullable().optional()
    }).partial()
};

module.exports = mechanicSchemas;
