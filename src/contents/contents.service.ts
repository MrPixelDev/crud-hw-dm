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
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { randomUUID, type UUID } from 'crypto';
import { UploadFilePayloadDto } from 'src/providers/s3/dto/upload-file-payload.dto';
import {
  AVATAR_FOLDER,
  ContentsTypesEnum,
  MAX_ACTIVE_AVATARS,
} from 'src/common/consts/contents.consts';
import { AvatarFileWorkerService } from 'src/common/workers/avatar-file-worker.service';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class ContentsService {
  constructor(
    private readonly _filesSvc: IFileService,
    private readonly _avatarWorkerSvc: AvatarFileWorkerService,
    private readonly _dataSrc: DataSource,
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

    const newContent = await this._dataSrc.transaction(async manager => {
      const updateResult = await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          activeAvatarCount: () => '"active_avatar_count" + 1',
          avatar: file.originalname,
        })
        .where('user_id = :userId', { userId })
        .andWhere('"active_avatar_count" < 5')
        .execute();

      if (!updateResult.affected) {
        throw new ConflictException(
          'Number of avatars must not be greater than 5'
        );
      }

      try {
        return await repo.save({
          userId,
          type: ContentsTypesEnum.AVATAR,
          fileName: path,
          originalName: file.originalname,
        });
      } catch (e) {
        await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({
            activeAvatarCount: () => '"active_avatar_count" - 1',
            avatar: () => `
              (
                SELECT original_name
                FROM contents
                WHERE user_id = :userId
                  AND type = :avatarType
                  AND deleted_at IS NULL
                ORDER BY created_at DESC, content_id DESC
                LIMIT 1
              )
            `,
          })
          .where('user_id = :userId', { userId })
          .setParameters({
            userId,
            avatarType: ContentsTypesEnum.AVATAR,
          })
          .execute();
        throw e;
      }
    });

    return new AvatarContentResponseDto(newContent);
  }

  async deleteAvatar(
    userId: UUID,
    contentId: number,
    manager?: EntityManager
  ): Promise<DeleteAvatarResponseDto> {
    const repo = this._getRepo(manager);

    await this._dataSrc.transaction(async manager => {
      const deleteResult = await repo.softDelete({
        contentId,
        userId,
        type: ContentsTypesEnum.AVATAR,
        deletedAt: IsNull(),
      });

      if (!deleteResult.affected) {
        throw new NotFoundException('Avatar not found');
      }

      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          activeAvatarCount: () => '"active_avatar_count" - 1',
          avatar: () => `
              (
                SELECT original_name
                FROM contents
                WHERE user_id = :userId
                  AND type = :avatarType
                  AND deleted_at IS NULL
                ORDER BY created_at DESC, content_id DESC
                LIMIT 1
              )
            `,
        })
        .where('user_id = :userId', { userId })
        .setParameters({
          userId,
          avatarType: ContentsTypesEnum.AVATAR,
        })
        .execute();
    });

    return { ok: true };
  }
}
