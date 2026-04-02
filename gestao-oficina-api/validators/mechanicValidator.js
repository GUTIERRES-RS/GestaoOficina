const { z } = require('zod');
const { uuid } = require('./common');

const mechanicSchemas = {
    create: z.object({
        name: z.string().min(3).max(100),
        phone: z.string().max(20).nullable().optional(),
        specialty: z.string().max(100).nullable().optional(),
        commission_rate: z.coerce.number().min(0).max(100).default(0),
        active: z.boolean().default(true)
    }),
    update: z.object({
        name: z.string().min(3).max(100).optional(),
        phone: z.string().max(20).nullable().optional(),
        specialty: z.string().max(100).nullable().optional(),
        commission_rate: z.coerce.number().min(0).max(100).optional(),
        active: z.boolean().optional()
    }).partial()
};

module.exports = mechanicSchemas;
