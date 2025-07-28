import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules'],
        testTimeout: 10000,
        sequence: {
            concurrent: false,
        },
        poolOptions: {
            threads: {
                maxThreads: 1,
                singleThread: true,
            },
        },
    },
    resolve: {
        alias: {
            '#src': path.resolve(__dirname, 'dist/src'),
        }
    }
})