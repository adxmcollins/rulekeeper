import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node16',
  clean: true,
  dts: true,
  splitting: false,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  esbuildOptions(options) {
    options.footer = {
      js: ''
    }
  }
})
