const { z } = require('zod');

/**
 * Esquemas de Validação para Configurações do Sistema
 */
const settingsSchemas = {
    /**
     * Esquema para atualização das configurações da oficina
     */
    update: z.object({
        workshop_name: z.string().min(2, "Nome da oficina é obrigatório").max(100),
        workshop_phone: z.string().max(20).nullable().optional(),
        workshop_email: z.string().email("E-mail inválido").nullable().optional(),
        workshop_address: z.string().max(255).nullable().optional(),
        workshop_document: z.string().max(20).nullable().optional(),
        theme: z.enum(['light', 'dark', 'system']).default('light'),
        currency: z.string().max(10).default('BRL'),
        logo_url: z.string().url("URL do logo inválida").nullable().optional(),
        whatsapp: z.string().max(20).nullable().optional(),
        review_days: z.coerce.number().int().min(0).default(30),
        next_os_number: z.coerce.number().int().min(1).default(1),
        items_per_page: z.coerce.number().int().min(1).max(100).default(10)
    }).partial()
};

module.exports = settingsSchemas;
