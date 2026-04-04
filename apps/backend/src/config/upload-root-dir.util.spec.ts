import os from 'node:os';
import path from 'node:path';
import {
  getDefaultUploadRootDir,
  resolveUploadRootDir,
} from './upload-root-dir.util';

describe('upload-root-dir util', () => {
  it('uses the project uploads directory by default outside tests', () => {
    expect(getDefaultUploadRootDir('development')).toBe(
      path.join(process.cwd(), 'uploads'),
    );
  });

  it('uses a temp uploads directory in tests', () => {
    expect(getDefaultUploadRootDir('test')).toBe(
      path.join(os.tmpdir(), 'tripbazarbd-test-uploads'),
    );
  });

  it('falls back when the env value is blank', () => {
    expect(resolveUploadRootDir('   ', 'development')).toBe(
      path.join(process.cwd(), 'uploads'),
    );
  });

  it('keeps an explicit upload root directory', () => {
    expect(resolveUploadRootDir('/tmp/custom-uploads', 'development')).toBe(
      '/tmp/custom-uploads',
    );
  });
});
