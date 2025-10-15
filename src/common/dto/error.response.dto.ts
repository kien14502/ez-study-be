import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP Status Code' })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '/api/resource', description: 'The requested path' })
  path: string;

  @ApiProperty({ example: '2025-10-07T08:00:00.000Z', description: 'Timestamp of the error' })
  timestamp: string;
}
