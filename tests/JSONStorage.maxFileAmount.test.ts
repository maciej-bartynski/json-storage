import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import JSONStorage from '#src/JSONStorage.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('JSONStorage maxFileAmount functionality', () => {
    let storage: JSONStorage;
    const testBaseDir = './test-data-max-file-amount';
    const testSubDir = 'test-subdir';

    beforeEach(async () => {
        JSONStorage.resetInstance();

        storage = JSONStorage.getInstance({ directory: testBaseDir });

        try {
            await fs.rm(path.join(testBaseDir, testSubDir), { recursive: true, force: true });
        } catch {
        }
    });

    afterEach(async () => {
        try {
            await fs.rm(testBaseDir, { recursive: true, force: true });
        } catch {
        }

        JSONStorage.resetInstance();
    });

    describe('connect with maxFileAmount', () => {
        it('should accept maxFileAmount parameter and return enhanced API', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 5 });

            expect(api).toHaveProperty('create');
            expect(api).toHaveProperty('read');
            expect(api).toHaveProperty('update');
            expect(api).toHaveProperty('delete');
            expect(api).toHaveProperty('all');
            expect(api).toHaveProperty('filter');
            expect(api).toHaveProperty('getStats');
        });

        it('should maintain backward compatibility with string parameter', async () => {
            const api = await storage.connect(testSubDir);

            expect(api).toHaveProperty('create');
            expect(api).toHaveProperty('getStats');
        });
    });

    describe('getStats method', () => {
        it('should return correct stats for empty directory', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 5 });
            const stats = await api.getStats();

            expect(stats.amount).toBe(0);
            expect(stats.createdAsc).toEqual([]);
            expect(stats.updatedAsc).toEqual([]);
        });

        it('should return correct stats for directory with files', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 5 });

            const result1 = await api.create({ _id: 'file1', name: 'file1', data: 'test1' });
            await new Promise(resolve => setTimeout(resolve, 10));
            const result2 = await api.create({ _id: 'file2', name: 'file2', data: 'test2' });

            const stats = await api.getStats();

            expect(stats.amount).toBe(2);
            expect(stats.createdAsc).toHaveLength(2);
            expect(stats.updatedAsc).toHaveLength(2);
            expect(stats.createdAsc[0]._id).toBe('file1');
            expect(stats.createdAsc[1]._id).toBe('file2');
        });

        it('should exclude .lock files from count', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 5 });

            await api.create({ _id: 'file1', name: 'file1', data: 'test1' });

            const lockPath = path.join(testBaseDir, testSubDir, 'file1.lock');
            await fs.mkdir(lockPath);

            const stats = await api.getStats();

            expect(stats.amount).toBe(1);
            expect(stats.createdAsc).toHaveLength(1);
        });
    });

    describe('createWithMaxAmountAllowed functionality', () => {
        it('should create files normally when under limit', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 3 });

            const result1 = await api.create({ _id: 'file1', name: 'file1', data: 'test1' });
            const result2 = await api.create({ _id: 'file2', name: 'file2', data: 'test2' });

            expect(result1._id).toBe('file1');
            expect(result2._id).toBe('file2');

            const stats = await api.getStats();
            expect(stats.amount).toBe(2);
        });

        it('should enforce file limit by removing oldest files', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 2 });

            await api.create({ _id: 'file1', name: 'file1', data: 'test1' });
            await new Promise(resolve => setTimeout(resolve, 10));
            await api.create({ _id: 'file2', name: 'file2', data: 'test2' });
            await new Promise(resolve => setTimeout(resolve, 10));
            await api.create({ _id: 'file3', name: 'file3', data: 'test3' });

            const stats = await api.getStats();
            expect(stats.amount).toBe(2);

            const allFiles = await api.all();
            const fileIds = allFiles.map(f => f._id);
            expect(fileIds).toContain('file2');
            expect(fileIds).toContain('file3');
            expect(fileIds).not.toContain('file1');
        });

        it('should handle exact limit correctly', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 2 });

            await api.create({ _id: 'file1', name: 'file1', data: 'test1' });
            await api.create({ _id: 'file2', name: 'file2', data: 'test2' });

            const stats = await api.getStats();
            expect(stats.amount).toBe(2);

            await api.create({ _id: 'file3', name: 'file3', data: 'test3' });

            const newStats = await api.getStats();
            expect(newStats.amount).toBe(2);

            const allFiles = await api.all();
            const fileIds = allFiles.map(f => f._id);
            expect(fileIds).toContain('file2');
            expect(fileIds).toContain('file3');
            expect(fileIds).not.toContain('file1');
        });
    });

    describe('concurrent operations', () => {
        it('should queue create operations correctly', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 2 });

            const promises = [
                api.create({ _id: 'file1', name: 'file1', data: 'test1' }),
                api.create({ _id: 'file2', name: 'file2', data: 'test2' }),
                api.create({ _id: 'file3', name: 'file3', data: 'test3' }),
                api.create({ _id: 'file4', name: 'file4', data: 'test4' })
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(4);
            expect(results[0]._id).toBe('file1');
            expect(results[1]._id).toBe('file2');
            expect(results[2]._id).toBe('file3');
            expect(results[3]._id).toBe('file4');

            const stats = await api.getStats();
            expect(stats.amount).toBe(2);

            const allFiles = await api.all();
            const fileIds = allFiles.map(f => f._id);
            expect(fileIds).toHaveLength(2);
            expect(fileIds.length).toBe(2);
        });
    });

    describe('edge cases', () => {
        it('should handle single file limit', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 1 });

            await api.create({ _id: 'file1', name: 'file1', data: 'test1' });
            await api.create({ _id: 'file2', name: 'file2', data: 'test2' });

            const stats = await api.getStats();
            expect(stats.amount).toBe(1);

            const allFiles = await api.all();
            expect(allFiles).toHaveLength(1);
            expect(allFiles[0]._id).toBe('file2');
        });

        it('should handle zero file limit', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 0 });

            await api.create({ _id: 'file1', name: 'file1', data: 'test1' });

            const stats = await api.getStats();
            expect(stats.amount).toBe(0);

            const allFiles = await api.all();
            expect(allFiles).toHaveLength(0);
        });

        it('should handle very large limit', async () => {
            const api = await storage.connect({ directory: testSubDir, maxFileAmount: 1000 });

            for (let i = 0; i < 10; i++) {
                await api.create({ _id: `file${i}`, name: `file${i}`, data: `test${i}` });
            }

            const stats = await api.getStats();
            expect(stats.amount).toBe(10);
        });
    });
});
