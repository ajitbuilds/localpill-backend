import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory that validates request body against a Zod schema.
 * Returns 400 with detailed errors if validation fails.
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const zodError = result.error as ZodError;
                const errors = zodError.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                res.status(400).json({
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }

            // Replace body with validated/transformed data
            req.body = result.data;
            next();
        } catch (error) {
            console.error('Validation error:', error);
            res.status(400).json({ error: 'Invalid request data' });
        }
    };
};

