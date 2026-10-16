import type { IUploadedMulterFile } from '../../../common/interfaces/upload-file.interface';

export class UploadFilePayloadDto {
  constructor(file: IUploadedMulterFile, folder: string, name: string) {
    this.file = file;
    this.folder = folder;
    this.name = name;
  }

  readonly file: IUploadedMulterFile;

  readonly folder: string;

  readonly name: string;
}
