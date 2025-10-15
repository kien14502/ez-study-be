import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '../dto/error.response.dto';

export function ApiGlobalResponses() {
  return applyDecorators(
    // 401 Unauthorized Response
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),

    // 403 Forbidden Response
    ApiResponse({
      status: 403,
      description: 'Forbidden resource',
      type: ErrorResponseDto,
    }),

    // 500 Internal Server Error Response (Optional)
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
    }),
  );
}
