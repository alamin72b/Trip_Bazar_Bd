import os from 'node:os';
import path from 'node:path';

export function getDefaultUploadRootDir(nodeEnv?: string): string {
  return nodeEnv === 'test'
    ? path.join(os.tmpdir(), 'tripbazarbd-test-uploads')
    : path.join(process.cwd(), 'uploads');
}

export function resolveUploadRootDir(
  uploadRootDir: string | undefined,
  nodeEnv?: string,
): string {
  const normalizedUploadRootDir = uploadRootDir?.trim();

  if (normalizedUploadRootDir) {
    return normalizedUploadRootDir;
  }

  return getDefaultUploadRootDir(nodeEnv);
}
