import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MemberWorkspace, MemberWorkspaceSchema } from './schemas/member-workspace.schema';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      {
        name: MemberWorkspace.name,
        schema: MemberWorkspaceSchema,
      },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceRepository],
})
export class WorkspaceModule {}
