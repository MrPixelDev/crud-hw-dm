import type { IUploadedMulterFile } from 'src/common/interfaces/upload-file.interface';

export interface AvatarFileWorkerInput {
  readonly file: Pick<IUploadedMulterFile, 'buffer' | 'mimetype'>;
}

export interface AvatarFileWorkerResult {
  readonly extension: 'png' | 'jpg';
  readonly checksum: string;
}

export interface AvatarFileWorkerSuccessMessage {
  readonly ok: true;
  readonly result: AvatarFileWorkerResult;
}

export interface AvatarFileWorkerErrorMessage {
  readonly ok: false;
  readonly error: string;
}

export type AvatarFileWorkerMessage =
  | AvatarFileWorkerSuccessMessage
  | AvatarFileWorkerErrorMessage;
