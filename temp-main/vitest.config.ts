import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@app': path.resolve(projectRoot, 'src/app'),
      '@core': path.resolve(projectRoot, 'src/core'),
      '@domain': path.resolve(projectRoot, 'src/domain'),
      '@shared': path.resolve(projectRoot, 'src/shared'),
      '@pages': path.resolve(projectRoot, 'src/pages'),
      '@features': path.resolve(projectRoot, 'src/features'),
      '@config': path.resolve(projectRoot, 'src/config'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
