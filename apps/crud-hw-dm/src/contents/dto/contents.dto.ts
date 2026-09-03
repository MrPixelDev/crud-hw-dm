import { UUID } from 'node:crypto';
import { ContentEntity } from '../entities/contents.entities';
import { ContentsTypesEnum } from '@crud-hw-dm/common/consts/contents.consts';

export type PartialContentDto = Pick<
  ContentEntity,
  'userId' | 'type' | 'fileName' | 'originalName'
>;

export class AvatarContentDto {
  constructor(partialContentDto: PartialContentDto) {
    this.userId = partialContentDto.userId;
    this.type = partialContentDto.type;
    this.fileName = partialContentDto.fileName;
    this.originalName = partialContentDto.originalName;
  }

  readonly userId!: UUID;
  readonly type!: ContentsTypesEnum;
  readonly fileName!: string;
  readonly originalName!: string;
}

export class AvatarContentResponseDto {
  constructor(avatarContent: ContentEntity) {
    this.contentId = avatarContent.contentId;
    this.fileName = avatarContent.fileName;
    this.createdAt = avatarContent.createdAt;
  }

  readonly contentId!: number;
  readonly fileName!: string;
  readonly createdAt!: Date;
}

export class DeleteAvatarResponseDto {
  readonly ok!: boolean;
}
