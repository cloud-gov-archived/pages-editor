import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    include: ['src/collections/Pages/*.test.ts'],
    // include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'],
    setupFiles: ['test/utils/transactions.ts'],
    // globalSetup: ['test/utils/seed.ts'],
    env: loadEnv('test', process.cwd(), ''),
    sequence: {
      hooks: 'stack'
    }
  },
})
