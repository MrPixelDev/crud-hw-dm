import { ContentEntity } from '../entities/contents.entities';

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
