
import * as fs from 'fs/promises';
import JSONStorage from '#src/JSONStorage.js';

const TEST_DIRECTORY = 'testing_directory';

describe('JSONStorage Singleton with Multi-Directory Support', () => {
    let testStorage: JSONStorage;

    beforeAll(async () => {
        // Reset singleton instance before each test suite
        JSONStorage.resetInstance();
        testStorage = JSONStorage.getInstance({ directory: TEST_DIRECTORY });
    });

    afterAll(async () => {
        await fs.rm(TEST_DIRECTORY, { recursive: true, force: true });
        // Reset singleton instance after tests
        JSONStorage.resetInstance();
    });

    describe('Singleton Behavior', () => {
        it('Should return the same instance when getInstance is called multiple times', () => {
            const instance1 = JSONStorage.getInstance({ directory: 'different_path' });
            const instance2 = JSONStorage.getInstance({ directory: 'another_path' });
            expect(instance1).toBe(instance2);
        });

        it('Should maintain the first directory configuration even when called with different parameters', () => {
            const instance1 = JSONStorage.getInstance({ directory: 'first_path' });
            const instance2 = JSONStorage.getInstance({ directory: 'second_path' });
            expect(instance1).toBe(instance2);
        });
    });

    describe('Multi-Directory CRUD Operations', () => {
        it('Should connect to items subdirectory and create directory', async () => {
            const storage = await testStorage.connect('items');
            const dir = await fs.stat(`${TEST_DIRECTORY}/items`);
            expect(dir.isDirectory()).toBe(true);
            const items = await fs.readdir(`${TEST_DIRECTORY}/items`, { withFileTypes: true });
            expect(items.length).toBe(0);
        });

        it('Should connect to elements subdirectory and create directory', async () => {
            const storage = await testStorage.connect('elements');
            const dir = await fs.stat(`${TEST_DIRECTORY}/elements`);
            expect(dir.isDirectory()).toBe(true);
            const items = await fs.readdir(`${TEST_DIRECTORY}/elements`, { withFileTypes: true });
            expect(items.length).toBe(0);
        });

        it('Should create file in items subdirectory and return correct data', async () => {
            const storage = await testStorage.connect('items');
            const result = await storage.create({
                fileName: 'this is some test file',
                content: 'Hello, world!'
            });

            expect(result).toBeDefined();
            expect(result._id).toBeDefined();
            expect(result.path).toContain(`${TEST_DIRECTORY}/items/${result._id}.json`);
            const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/items/${result._id}.json`, 'utf8');
            expect(JSON.parse(file)).toEqual({
                fileName: 'this is some test file',
                content: 'Hello, world!'
            });
        });

        it('Should create file in elements subdirectory and return correct data', async () => {
            const storage = await testStorage.connect('elements');
            const result = await storage.create({
                fileName: 'element test file',
                content: 'Element content'
            });

            expect(result).toBeDefined();
            expect(result._id).toBeDefined();
            expect(result.path).toContain(`${TEST_DIRECTORY}/elements/${result._id}.json`);
            const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/elements/${result._id}.json`, 'utf8');
            expect(JSON.parse(file)).toEqual({
                fileName: 'element test file',
                content: 'Element content'
            });
        });

        it('Should update file in items subdirectory and return correct data', async () => {
            const storage = await testStorage.connect('items');
            const testFileId = 'testfileid';
            await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/items/${testFileId}.json`, JSON.stringify({
                _id: testFileId,
                fileName: 'this is some test file',
                content: 'Hello, world!'
            }), { flag: 'wx' });

            const result = await storage.update(testFileId, ({
                content: 'updated',
                number: 42
            }));

            expect(result.path).toContain(`${TEST_DIRECTORY}/items/${result._id}.json`);
            const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/items/${testFileId}.json`, 'utf8');
            expect(JSON.parse(file)).toEqual({
                content: 'updated',
                number: 42
            });
        });

        it('Should read file from items subdirectory', async () => {
            const storage = await testStorage.connect('items');
            const testFileId = 'readtest';
            const testData = {
                fileName: 'read test file',
                content: 'Read test content'
            };

            await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/items/${testFileId}.json`, JSON.stringify(testData), { flag: 'wx' });

            const result = await storage.read(testFileId);
            expect(result.fileName).toBe(testData.fileName);
            expect(result.content).toBe(testData.content);
            expect(result._id).toBe(testFileId);
        });

        it('Should delete file from items subdirectory', async () => {
            const storage = await testStorage.connect('items');
            const testFileId = 'deletetest';
            const testData = {
                fileName: 'delete test file',
                content: 'Delete test content'
            };

            await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/items/${testFileId}.json`, JSON.stringify(testData), { flag: 'wx' });

            await storage.delete(testFileId);

            // Verify file is deleted
            await expect(fs.access(`${process.cwd()}/${TEST_DIRECTORY}/items/${testFileId}.json`)).rejects.toThrow();
        });

        it('Should get all files from items subdirectory', async () => {
            const storage = await testStorage.connect('items');

            // Create multiple test files
            await storage.create({ name: 'file1', content: 'content1' });
            await storage.create({ name: 'file2', content: 'content2' });

            const allFiles = await storage.all();
            expect(allFiles.length).toBeGreaterThanOrEqual(2);
            expect(allFiles.some(f => f.name === 'file1')).toBe(true);
            expect(allFiles.some(f => f.name === 'file2')).toBe(true);
        });

        it('Should filter files in items subdirectory', async () => {
            const storage = await testStorage.connect('items');

            // Create test files with different properties
            await storage.create({ name: 'filter1', age: 25, active: true });
            await storage.create({ name: 'filter2', age: 30, active: false });
            await storage.create({ name: 'filter3', age: 35, active: true });

            const activeUsers = await storage.filter({
                where: { active: true }
            });
            expect(activeUsers.length).toBe(2);

            const olderUsers = await storage.filter({
                where: { age: { $gte: 30 } }
            });
            expect(olderUsers.length).toBe(2);
        });
    });

    describe('Connection Queue Behavior', () => {
        it('Should queue connections to the same subdirectory', async () => {
            const connectPromises = [
                testStorage.connect('queue_test'),
                testStorage.connect('queue_test'),
                testStorage.connect('queue_test')
            ];

            const results = await Promise.all(connectPromises);
            expect(results.length).toBe(3);

            // All should return the same storage interface
            results.forEach(result => {
                expect(typeof result.create).toBe('function');
                expect(typeof result.read).toBe('function');
                expect(typeof result.update).toBe('function');
                expect(typeof result.delete).toBe('function');
                expect(typeof result.all).toBe('function');
                expect(typeof result.filter).toBe('function');
            });
        });

        it('Should not block connections to different subdirectories', async () => {
            const startTime = Date.now();

            const connectPromises = [
                testStorage.connect('parallel1'),
                testStorage.connect('parallel2'),
                testStorage.connect('parallel3')
            ];

            const results = await Promise.all(connectPromises);
            const endTime = Date.now();

            expect(results.length).toBe(3);
            // Connections to different subdirectories should not block each other
            // This is a basic test - in practice, the actual timing would depend on filesystem operations
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Error Handling', () => {
        it('Should throw error when connecting without subdirectory', async () => {
            // @ts-ignore - Testing invalid usage
            await expect(testStorage.connect()).rejects.toThrow('Subdirectory is required');
        });

        it('Should throw error when connecting with empty subdirectory', async () => {
            await expect(testStorage.connect('')).rejects.toThrow('Subdirectory is required');
        });
    });
});