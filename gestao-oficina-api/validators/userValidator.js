const { z } = require('zod');

const userSchemas = {
    create: z.object({
        name: z.string().min(3).max(100),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        role: z.enum(['admin', 'user']).default('user')
    }),
    update: z.object({
        name: z.string().min(3).max(100).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        role: z.enum(['admin', 'user']).optional()
    }).partial()
};

module.exports = userSchemas;
