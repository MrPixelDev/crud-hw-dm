import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { FilesModule } from 'src/providers/files.module';
import { ContentsController } from './contents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentEntity } from './entities/contents.entities';
import { JwtModule } from '@nestjs/jwt';
import { AvatarFileWorkerService } from 'src/common/workers/avatar-file-worker.service';
import { AvatarFileValidationPipe } from 'src/common/pipes/avatar-file-validation.pipe';
import { UsersModule } from 'src/users/users.module';

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
