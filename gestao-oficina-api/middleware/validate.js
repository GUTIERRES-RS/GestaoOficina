const { z } = require('zod');
const logger = require('../services/logger');

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.warn(`Validation Error: ${JSON.stringify(error.errors)}`);
            return res.status(400).json({
                message: 'Erro de validação',
                errors: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        next(error);
    }
};

module.exports = validate;
