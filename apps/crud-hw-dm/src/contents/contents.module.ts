import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { FilesModule } from '@crud-hw-dm/providers/files.module';
import { ContentsController } from './contents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentEntity } from './entities/contents.entities';
import { JwtModule } from '@nestjs/jwt';
import { AvatarFileWorkerService } from '@crud-hw-dm/common/workers/avatar-file-worker.service';
import { AvatarFileValidationPipe } from '@crud-hw-dm/common/pipes/avatar-file-validation.pipe';
import { UsersModule } from '@crud-hw-dm/users/users.module';

@Module({
  imports: [
    UsersModule,
    FilesModule,
    JwtModule,
    TypeOrmModule.forFeature([ContentEntity]),
  ],
  providers: [
    ContentsService,
    AvatarFileWorkerService,
    AvatarFileValidationPipe,
  ],
  controllers: [ContentsController],
})
export class ContentsModule {}
