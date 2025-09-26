import Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(5000),
  APP_GLOBAL_PREFIX: Joi.string().default('v1'),
});
