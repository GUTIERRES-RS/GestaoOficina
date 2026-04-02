const { z } = require('zod');
const { uuid } = require('./common');

const vehicleSchemas = {
    create: z.object({
        client_id: uuid,
        plate: z.string().min(7).max(10).toUpperCase(),
        brand: z.string().min(2).max(50),
        model: z.string().min(1).max(50),
        year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).nullable().optional(),
        color: z.string().max(30).nullable().optional(),
        km_cad: z.coerce.number().int().min(0).nullable().optional(),
        vin: z.string().max(20).nullable().optional()
    }),
    update: z.object({
        brand: z.string().min(2).max(50).optional(),
        model: z.string().min(1).max(50).optional(),
        plate: z.string().min(7).max(10).toUpperCase().optional(),
        year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).nullable().optional(),
        color: z.string().max(30).nullable().optional(),
        km_cad: z.coerce.number().int().min(0).nullable().optional(),
        vin: z.string().max(20).nullable().optional()
    }).partial()
};

module.exports = vehicleSchemas;
