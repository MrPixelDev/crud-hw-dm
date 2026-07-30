import {
  BadRequestException,
  Injectable,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import type {
  AvatarFileWorkerInput,
  AvatarFileWorkerMessage,
  AvatarFileWorkerResult,
} from './avatar-file-worker.contract';
import type { IUploadedMulterFile } from '../interfaces/upload-file.interface';
import {
  AVATAR_WORKER_FILE_NAME,
  AVATAR_WORKER_TIMEOUT_MS,
} from '../consts/worker.consts';

@Injectable()
export class AvatarFileWorkerService {
  private _runWorker(
    workerData: AvatarFileWorkerInput
  ): Promise<AvatarFileWorkerResult> {
    return new Promise((resolve, reject) => {
      const workerPath = join(__dirname, AVATAR_WORKER_FILE_NAME);
      const worker = new Worker(workerPath, {
        workerData,
      });

      const timer = setTimeout(() => {
        void worker.terminate().finally(() => {
          reject(new RequestTimeoutException('Avatar processing time out'));
        });
      }, AVATAR_WORKER_TIMEOUT_MS);

      worker.once('message', (message: AvatarFileWorkerMessage) => {
        clearTimeout(timer);

        if (!message.ok) {
          reject(new BadRequestException(message.error));
          return;
        }

        resolve(message.result);
      });

      worker.once('error', error => {
        clearTimeout(timer);
        reject(
          new ServiceUnavailableException(
            `Avatar processing worker failed: ${error.message}`
          )
        );
      });

      worker.once('exit', code => {
        clearTimeout(timer);

        if (code !== 0) {
          reject(
            new ServiceUnavailableException(
              `Avatar processing worker exited with code ${code}`
            )
          );
        }
      });
    });
  }

  process(file: IUploadedMulterFile): Promise<AvatarFileWorkerResult> {
    const workerData: AvatarFileWorkerInput = {
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
      },
    };

    return this._runWorker(workerData);
  }
}
