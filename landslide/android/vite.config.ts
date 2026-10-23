import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const proxyRules = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
  '/mobile-analytics': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(true),
  },
  resolve: {
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: [
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNative.*/,
        replacement: path.resolve(__dirname, './web-rn-shim.ts'),
      },
      {
        find: /^@react-native\/assets-registry\/registry$/,
        replacement: path.resolve(
          __dirname,
          './node_modules/react-native-web/dist/modules/AssetRegistry/index.js'
        ),
      },
      {
        find: /^react-native$/,
        replacement: path.resolve(__dirname, './web-rn-shim.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: proxyRules,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: proxyRules,
  },
});
