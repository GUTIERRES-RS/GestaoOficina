const { z } = require('zod');

const authSchemas = {
    login: z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
    }),
    refresh: z.object({
        refreshToken: z.string()
    })
};

module.exports = authSchemas;
