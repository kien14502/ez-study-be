import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetMemberWorkspaceDto {
  @ApiProperty()
  @IsString()
  member_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  wsId: string;
}
