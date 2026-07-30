import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_FILE_SIZE_BYTES,
} from '@crud-hw-dm/common/consts/contents.consts';
import type { IUploadedMulterFile } from '@crud-hw-dm/common/interfaces/upload-file.interface';

@Injectable()
export class AvatarFileValidationPipe implements PipeTransform<
  IUploadedMulterFile | undefined,
  IUploadedMulterFile
> {
  transform(file: IUploadedMulterFile | undefined): IUploadedMulterFile {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!(file.mimetype && ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype))) {
      throw new BadRequestException('Avatar file must be JPEG or PNG');
    }

    const fileSize = file.size ?? file.buffer.length;

    if (fileSize > MAX_AVATAR_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        'Avatar file must not be greater than 10 MB'
      );
    }

    return file;
  }
}
