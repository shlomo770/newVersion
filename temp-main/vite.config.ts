import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
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
    },
  },
  optimizeDeps: {
    include: [
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/mapbox',
      '@deck.gl/react',
      '@deck.gl/extensions',
      '@luma.gl/core',
      '@luma.gl/engine',
      '@luma.gl/shadertools',
      '@luma.gl/webgl',
      'geotiff',
    ],
  },
  worker: {
    format: 'es',
  },
  server: {
    host: true,
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
