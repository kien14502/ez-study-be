// decorators/api-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiDefaultOkResponseOptions<T extends Type<unknown>> {
  type?: T;
  isArray?: boolean;
  description?: string;
}

export function ApiDefaultOkResponse<T extends Type<unknown>>(options: ApiDefaultOkResponseOptions<T> = {}) {
  const { type, isArray = false, description = 'Successful operation' } = options;

  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [];

  if (type) {
    decorators.push(ApiExtraModels(type));
  }

  decorators.push(
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            example: 200,
          },
          message: {
            type: 'string',
            example: 'Success',
          },
          data: type
            ? isArray
              ? {
                  type: 'array',
                  items: { $ref: getSchemaPath(type) },
                }
              : { $ref: getSchemaPath(type) }
            : {
                type: 'object',
                example: {},
              },
        },
      },
    }),
  );

  return applyDecorators(...decorators);
}
