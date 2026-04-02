const { z } = require('zod');

const commonSchemas = {
    uuid: z.string().uuid({ message: "ID inválido (esperado UUID v4)" }),
    pagination: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10)
    }).partial()
};

module.exports = commonSchemas;
