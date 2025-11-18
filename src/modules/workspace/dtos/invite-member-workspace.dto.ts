import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberWorkspaceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idMember: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  wsId: string;
}
