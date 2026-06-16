import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IFileService } from 'src/providers/files.adapter';
import type { IUploadedMulterFile } from 'src/common/interfaces/upload-file.interface';
import {
  AvatarContentResponseDto,
  DeleteAvatarResponseDto,
} from './dto/contents.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentEntity } from './entities/contents.entities';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { randomUUID, type UUID } from 'crypto';
import { UploadFilePayloadDto } from 'src/providers/s3/dto/upload-file-payload.dto';
import {
  AVATAR_FOLDER,
  ContentsTypesEnum,
  MAX_ACTIVE_AVATARS,
} from 'src/common/consts/contents.consts';
import { AvatarFileWorkerService } from 'src/common/workers/avatar-file-worker.service';

@Injectable()
export class ContentsService {
  constructor(
    private readonly _filesSvc: IFileService,
    private readonly _avatarWorkerSvc: AvatarFileWorkerService,
    @InjectRepository(ContentEntity)
    private readonly _contentRepo: Repository<ContentEntity>
  ) {}

  private _getRepo(manager?: EntityManager): Repository<ContentEntity> {
    return manager ? manager.getRepository(ContentEntity) : this._contentRepo;
  }

  private async _assertAvatarLimit(
    repo: Repository<ContentEntity>,
    userId: UUID
  ): Promise<void> {
    const activeAvatars = await repo.countBy({
      userId,
      type: ContentsTypesEnum.AVATAR,
      deletedAt: IsNull(),
    });

    if (activeAvatars >= MAX_ACTIVE_AVATARS) {
      throw new ConflictException(
        'Number of avatars must not be greater than 5.'
      );
    }
  }

  private _getAvatarFileName(
    userId: UUID,
    extension: 'png' | 'jpg',
    checksum: string
  ): string {
    return `${userId}/${randomUUID()}-${checksum.slice(0, 12)}.${extension}`;
  }

  async createAvatar(
    userId: UUID,
    file: IUploadedMulterFile,
    manager?: EntityManager
  ): Promise<AvatarContentResponseDto> {
    const repo = this._getRepo(manager);

    await this._assertAvatarLimit(repo, userId);

    const processedFile = await this._avatarWorkerSvc.process(file);

    const { path } = await this._filesSvc.uploadFile(
      new UploadFilePayloadDto(
        file,
        AVATAR_FOLDER,
        this._getAvatarFileName(
          userId,
          processedFile.extension,
          processedFile.checksum
        )
      )
    );

    const content = repo.create({
      userId,
      type: ContentsTypesEnum.AVATAR,
      fileName: path,
    });

    const savedContent = await repo.save(content);

    return new AvatarContentResponseDto(savedContent);
  }

  async deleteAvatar(
    userId: UUID,
    contentId: number,
    manager?: EntityManager
  ): Promise<DeleteAvatarResponseDto> {
    const repo = this._getRepo(manager);
    const deleteResult = await repo.softDelete({
      contentId,
      userId,
      type: ContentsTypesEnum.AVATAR,
      deletedAt: IsNull(),
    });

    if (!deleteResult.affected) {
      throw new NotFoundException('Avatar not found');
    }

    return { ok: true };
  }
}
