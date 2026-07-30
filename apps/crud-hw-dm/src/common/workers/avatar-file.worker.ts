import { createHash } from 'node:crypto';
import { parentPort, workerData } from 'node:worker_threads';
import type {
  AvatarFileWorkerInput,
  AvatarFileWorkerMessage,
  AvatarFileWorkerResult,
} from './avatar-file-worker.contract';
import { JPEG_SIGNATURE, PNG_SIGNATURE } from '../consts/worker.consts';

function hasSignature(fileBuffer: Buffer, signature: number[]): boolean {
  if (fileBuffer.length < signature.length) {
    return false;
  }

  return signature.every((byte, index) => fileBuffer[index] === byte);
}

function resolveExtension(
  fileBuffer: Buffer,
  mimeType?: string
): 'png' | 'jpg' {
  if (hasSignature(fileBuffer, PNG_SIGNATURE) || mimeType === 'image/png') {
    return 'png';
  }

  if (hasSignature(fileBuffer, JPEG_SIGNATURE) || mimeType === 'image/jpeg') {
    return 'jpg';
  }

  throw new Error('Unsupported avatar file type');
}

function processAvatarFile(
  input: AvatarFileWorkerInput
): AvatarFileWorkerResult {
  const fileBuffer = Buffer.from(input.file.buffer);
  const extension = resolveExtension(fileBuffer, input.file.mimetype);
  const checksum = createHash('sha256').update(fileBuffer).digest('hex');

  return { extension, checksum };
}

function postMessage(message: AvatarFileWorkerMessage): void {
  if (!parentPort) {
    throw new Error('Avatar worker must run in a worker thread context');
  }

  parentPort.postMessage(message);
}

try {
  const input = workerData as AvatarFileWorkerInput;
  const result = processAvatarFile(input);

  postMessage({ ok: true, result });
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Unknown worker error';
  postMessage({ ok: false, error: message });
}
