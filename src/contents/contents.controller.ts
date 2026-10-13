import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContentsService } from './contents.service';
import {
  AvatarContentResponseDto,
  DeleteAvatarResponseDto,
} from './dto/contents.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_SCHEME } from 'src/common/consts/swagger.consts';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AvatarFileValidationPipe } from 'src/common/pipes/avatar-file-validation.pipe';
import type { UUID } from 'crypto';
import type { IUploadedMulterFile } from 'src/common/interfaces/upload-file.interface';
import type { FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';

@ApiTags('Профиль')
@ApiBearerAuth(SWAGGER_BEARER_SCHEME)
@Controller('contents')
export class ContentsController {
  constructor(
    private readonly _contentsSvc: ContentsService,
    private readonly _avatarFileValidationPipe: AvatarFileValidationPipe
  ) {}

  private async _mapMultipartFile(
    multipartFile: MultipartFile | undefined
  ): Promise<IUploadedMulterFile> {
    if (!multipartFile) {
      return this._avatarFileValidationPipe.transform(undefined);
    }

    const buffer = await multipartFile.toBuffer();

    return this._avatarFileValidationPipe.transform({
      fieldname: multipartFile.fieldname,
      originalname: multipartFile.filename,
      encoding: multipartFile.encoding,
      mimetype: multipartFile.mimetype,
      buffer,
      size: buffer.length,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Post('avatar')
  async createAvatar(
    @CurrentUser('sub') userId: UUID,
    @Req() req: FastifyRequest
  ): Promise<AvatarContentResponseDto> {
    const requestWithFile = req as FastifyRequest & {
      file: () => Promise<MultipartFile | undefined>;
    };
    const multipartFile = await requestWithFile.file();
    const file = await this._mapMultipartFile(multipartFile);

    return this._contentsSvc.createAvatar(userId, file);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('avatar/:contentId')
  async deleteAvatar(
    @CurrentUser('sub') userId: UUID,
    @Param('contentId', ParseIntPipe) contentId: number
  ): Promise<DeleteAvatarResponseDto> {
    return this._contentsSvc.deleteAvatar(userId, contentId);
  }
}
