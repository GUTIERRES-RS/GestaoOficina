const { z } = require('zod');
const { uuid } = require('./common');

const osSchemas = {
    create: z.object({
        client_id: uuid,
        vehicle_id: uuid,
        mechanic_id: uuid.nullable().optional(),
        mechanic_name: z.string().max(100).nullable().optional(),
        problem_reported: z.string().min(3, "Problema relatado é muito curso"),
        service_provided: z.string().nullable().optional(),
        status: z.enum(['Aberto','Orçamento','Aprovado','Em andamento','Aguardando Peça','Finalizado','Entregue','Cancelado']).default('Aberto'),
        labor_cost: z.coerce.number().min(0).default(0),
        parts_cost: z.coerce.number().min(0).default(0),
        total_cost: z.coerce.number().min(0).default(0),
        discount: z.coerce.number().min(0).default(0),
        invoice_number: z.string().max(50).nullable().optional(),
        vehicle_km: z.coerce.number().int().min(0).nullable().optional(),
        expected_delivery_date: z.string().nullable().optional(),
        parts: z.array(z.object({
            part_id: uuid,
            quantity: z.coerce.number().int().min(1),
            unit_price: z.coerce.number().min(0)
        })).optional()
    }),
    
    update: z.object({
        status: z.enum(['Aberto','Orçamento','Aprovado','Em andamento','Aguardando Peça','Finalizado','Entregue','Cancelado']).optional(),
        problem_reported: z.string().optional(),
        service_provided: z.string().nullable().optional(),
        labor_cost: z.coerce.number().min(0).optional(),
        parts_cost: z.coerce.number().min(0).optional(),
        total_cost: z.coerce.number().min(0).optional(),
        discount: z.coerce.number().min(0).optional(),
        mechanic_id: uuid.nullable().optional(),
        mechanic_name: z.string().nullable().optional(),
        expected_delivery_date: z.string().nullable().optional(),
        invoice_number: z.string().nullable().optional(),
        vehicle_km: z.coerce.number().int().optional(),
        payment_method: z.string().nullable().optional(),
        payment_status: z.enum(['pendente','pago','cancelado']).optional(),
        parts: z.array(z.object({
            part_id: uuid,
            quantity: z.coerce.number().int().min(1),
            unit_price: z.coerce.number().min(0)
        })).optional()
    }).partial()
};

module.exports = osSchemas;
