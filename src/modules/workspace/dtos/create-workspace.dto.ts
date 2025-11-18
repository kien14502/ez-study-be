import { OmitType } from '@nestjs/swagger';

import { Workspace } from '../schemas/workspace.schema';

export class CreateWorkSpaceDto extends OmitType(Workspace, ['members', 'ownerId']) {}
