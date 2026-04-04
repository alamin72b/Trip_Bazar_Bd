import os from 'node:os';
import path from 'node:path';

export function resolveUploadRootDir(
  uploadRootDir: string | undefined,
  nodeEnv: string | undefined,
): string {
  const normalizedUploadRootDir = uploadRootDir?.trim();

  if (normalizedUploadRootDir) {
    return normalizedUploadRootDir;
  }

  if (nodeEnv === 'test') {
    return path.join(os.tmpdir(), 'tripbazarbd-test-uploads');
  }

  return path.join(process.cwd(), 'uploads');
}
