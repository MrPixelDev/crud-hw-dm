import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IFileService } from 'src/providers/files.adapter';
import type { IUploadedMulterFile } from 'src/common/interfaces/upload-file.interface';
import {
  AvatarContentDto,
  AvatarContentResponseDto,
  DeleteAvatarResponseDto,
} from './dto/contents.dto';
import { ContentEntity } from './entities/contents.entities';
import { DataSource, IsNull } from 'typeorm';
import { randomUUID, type UUID } from 'crypto';
import { UploadFilePayloadDto } from 'src/providers/s3/dto/upload-file-payload.dto';
import {
  AVATAR_FOLDER,
  ContentsTypesEnum,
} from 'src/common/consts/contents.consts';
import { AvatarFileWorkerService } from 'src/common/workers/avatar-file-worker.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { RemoveFilePayloadDto } from 'src/providers/s3/dto/remove-file-payload.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ContentsService {
  constructor(
    private readonly _usersSvc: UsersService,
    private readonly _filesSvc: IFileService,
    private readonly _avatarWorkerSvc: AvatarFileWorkerService,
    private readonly _dataSrc: DataSource
  ) {}

  private _normalizeOriginalName(originalName: string): string {
    const normalized = originalName
      .normalize('NFKC')
      .replace(/[^\w.\- ]/g, '')
      .trim()
      .slice(0, 255);

    return normalized || 'unnamed';
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
    file: IUploadedMulterFile
  ): Promise<AvatarContentResponseDto> {
    const newContent = await this._dataSrc.transaction(async manager => {
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

      const normalizedOriginalName = this._normalizeOriginalName(
        file.originalname
      );

      try {
        const updateResult = await manager
          .createQueryBuilder()
          .update(UserEntity)
          .set({
            activeAvatarCount: () => '"active_avatar_count" + 1',
            avatar: path,
          })
          .where('user_id = :userId', { userId })
          .andWhere('"active_avatar_count" < 5')
          .execute();

        if (!updateResult.affected) {
          throw new ConflictException(
            'Number of avatars must not be greater than 5'
          );
        }

        await manager.save(
          new AvatarContentDto({
            userId,
            type: ContentsTypesEnum.AVATAR,
            fileName: path,
            originalName: normalizedOriginalName,
          })
        );

        await this._usersSvc.deleteMostActiveUsersCache();

        return await manager.findOne(ContentEntity, {
          where: {
            userId,
            fileName: path,
          },
        });
      } catch (error) {
        await this._filesSvc.removeFile(new RemoveFilePayloadDto(path));
        throw error;
      }
    });

    if (!newContent) {
      throw new NotFoundException('Something went wrong');
    }

    await this._usersSvc.deleteContentProfileCache(userId);

    return new AvatarContentResponseDto(newContent);
  }

  async deleteAvatar(
    userId: UUID,
    contentId: number
  ): Promise<DeleteAvatarResponseDto> {
    await this._dataSrc.transaction(async manager => {
      const content = await manager.findOne(ContentEntity, {
        where: {
          contentId,
        },
      });

      if (!content) {
        throw new NotFoundException('Avatar not found');
      }

      const deleteResult = await manager.softDelete(ContentEntity, {
        contentId,
        userId,
        type: ContentsTypesEnum.AVATAR,
        deletedAt: IsNull(),
      });

      if (!deleteResult.affected) {
        throw new NotFoundException('Avatar not found');
      }

      await this._filesSvc.removeFile(
        new RemoveFilePayloadDto(content.fileName)
      );

      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          activeAvatarCount: () => '"active_avatar_count" - 1',
          avatar: () => `
              (
                SELECT file_name
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

    await this._usersSvc.deleteContentProfileCache(userId);

    return { ok: true };
  }
}
