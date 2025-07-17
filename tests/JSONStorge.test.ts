
import fs from 'fs/promises';
import JSONStorage from '@/JSONStorage';

const TEST_DIRECTORY = 'testing_directory';

describe('FileStorage data/testing_directory CRUD should work', () => {
    let testStorage: JSONStorage;
    beforeAll(async () => {
        testStorage = new JSONStorage({ directory: TEST_DIRECTORY });
    });

    afterAll(async () => {
        await fs.rm(TEST_DIRECTORY, { recursive: true, force: true });
    });

    it('Should connect and create directory', async () => {
        await testStorage.connect();
        const dir = await fs.stat(TEST_DIRECTORY);
        expect(dir.isDirectory()).toBe(true);
        const items = await fs.readdir(TEST_DIRECTORY, { withFileTypes: true });
        expect(items.length).toBe(0)
    });

    it('Should create file and return correct data', async () => {
        const storage = await testStorage.connect();
        const result = await storage.create({
            fileName: 'this is some test file',
            content: 'Hello, world!'
        });

        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.path).toContain(`${TEST_DIRECTORY}/${result._id}.json`);
        const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/${result._id}.json`, 'utf8');
        expect(JSON.parse(file)).toEqual({
            fileName: 'this is some test file',
            content: 'Hello, world!'
        });
    });

    it('Should update file and return correct data', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid';
        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });
        const result = await storage.update(testFileId, ({
            content: 'updated',
            number: 42
        }));
        expect(result.path).toContain(`${TEST_DIRECTORY}/${result._id}.json`);
        const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/${result._id}.json`, 'utf8');
        expect(JSON.parse(file)).toEqual({
            content: 'updated',
            number: 42
        });
    });

    it('Should fail to update file when another process is updating it', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid2';

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });

        const result = await Promise.allSettled([
            () => storage.update(testFileId, ({
                content: 'update-1',
            })),
            () => storage.update(testFileId, ({
                content: 'updated-2',
            })),
            () => storage.update(testFileId, ({
                content: 'updated-3',
            })),
        ].map(update => update()));
        expect(result.filter(item => item.status === 'fulfilled').length).toBe(1);
        expect(result.filter(item => item.status === 'rejected').length).toBe(2);
        const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, 'utf8');
        expect(JSON.parse(file)).toEqual({
            content: 'update-1'
        });

    });

    it('Should remove lock after update', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid3';

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });
        await Promise.allSettled([
            storage.update(testFileId, ({
                content: 'update-1',
            })).catch(() => { }),
            storage.update(testFileId, ({
                content: 'updated-2',
            })).catch(() => { }), ,
            storage.update(testFileId, ({
                content: 'updated-3',
            })).catch(() => { }),
        ]);
        await storage.update(testFileId, ({
            content: 'update-4',
        }));
        const file = await fs.readFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, 'utf8');
        expect(JSON.parse(file)).toEqual({
            content: 'update-4'
        });
    });

    it('Should read file', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid4';

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });

        const result = await storage.read(testFileId);
        expect(result.stats).toBeDefined();
        delete (result as any).stats;
        expect(result).toEqual({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        });
    });

    it('Should delete file', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid5';

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });
        const result = await storage.delete(testFileId);
        expect(result).toBeFalsy();

        try {
            await fs.access(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`);
            expect(false).toBe(true);
        } catch (err) {
            const error = err as any;
            expect('code' in error).toBe(true);
            expect(error.code).toBe('ENOENT');
        }
    });

    it('Should fail tu update if deletion is being processed at the same time', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid6';

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/${testFileId}.json`, JSON.stringify({
            _id: testFileId,
            fileName: 'this is some test file',
            content: 'Hello, world!'
        }), { flag: 'wx' });

        storage.delete(testFileId);
        try {
            await storage.update(testFileId, { newField: 'new field' })
            expect(false).toBe(true);
        } catch (err) {
            const error = err as any;
            expect('code' in error).toBe(true);
            expect(error.code).toBe('EEXIST');
        }
    });

    it('Should go through CRUD operations', async () => {
        const storage = await testStorage.connect();
        const testFileId = 'testfileid7';

        const { _id } = await storage.create({
            _id: testFileId,
            name: 'Frodo',
            surname: 'Bagins'
        });

        const entry = await storage.read(_id);

        expect(entry).toEqual({
            _id,
            name: 'Frodo',
            surname: 'Bagins',
            stats: entry.stats,
        });

        delete (entry as any)._id;
        await storage.update(_id, {
            ...entry,
            newField: 'new field'
        })

        const updatedEntry = await storage.read(_id);

        expect(updatedEntry).toEqual({
            _id,
            name: 'Frodo',
            surname: 'Bagins',
            newField: 'new field',
            stats: updatedEntry.stats,
        });

        await storage.delete(_id);

        try {
            await fs.access(`${process.cwd()}/${TEST_DIRECTORY}/${_id}.json`);
            expect(false).toBe(true);
        } catch (err) {
            const error = err as any;
            expect('code' in error).toBe(true);
            expect(error.code).toBe('ENOENT');
        }
    });

    it('return all files', async () => {
        await fs.rmdir(`${process.cwd()}/${TEST_DIRECTORY}`, { recursive: true });
        const storage = await testStorage.connect();

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/test-file-1.json`, JSON.stringify({
            _id: 'test-file-1',
            name: 'Frodo',
            surname: 'Bagins'
        }), { flag: 'wx' });

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/test-file-2.json`, JSON.stringify({
            _id: 'test-file-2',
            name: 'Smeagol',
            surname: 'Not sure'
        }), { flag: 'wx' });

        await fs.writeFile(`${process.cwd()}/${TEST_DIRECTORY}/test-file-3.json`, JSON.stringify({
            _id: 'test-file-3',
            name: 'Sauron',
            surname: 'The Great'
        }), { flag: 'wx' });

        const files = await storage.all();

        expect(files).toEqual([
            { _id: 'test-file-1', name: 'Frodo', surname: 'Bagins', stats: await fs.stat(`${process.cwd()}/${TEST_DIRECTORY}/test-file-1.json`) },
            { _id: 'test-file-2', name: 'Smeagol', surname: 'Not sure', stats: await fs.stat(`${process.cwd()}/${TEST_DIRECTORY}/test-file-2.json`) },
            { _id: 'test-file-3', name: 'Sauron', surname: 'The Great', stats: await fs.stat(`${process.cwd()}/${TEST_DIRECTORY}/test-file-3.json`) }
        ])
    });

});