import * as fs from "fs/promises";
import { JSONStorageDocument, Filter } from "#src/JSONStorage.types.js";
import AsyncTasksQueue from "@bartek01001/async-tasks-queue";
import * as crypto from "crypto";

class JSONStorage {
    private directory: string;
    private connectinQueue = new AsyncTasksQueue();

    constructor(params: {
        directory: string;
    }) {
        this.directory = params.directory;
        this.create = this.create.bind(this);
        this.read = this.read.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.all = this.all.bind(this);
        this.filter = this.filter.bind(this);
    }

    async connect(): Promise<{
        create: (data: Record<string, any>) => Promise<{
            _id: string;
            path: string;
        }>;
        read: (fileName: string) => Promise<JSONStorageDocument>;
        update: (fileName: string, data: Record<string, any>) => Promise<{
            _id: string;
            path: string;
        }>;
        delete: (fileName: string) => Promise<void>;
        all: () => Promise<Record<string, any>[]>;
        filter: <T = any>(options: {
            where?: Record<string, Filter | string | number | boolean>;
            sort?: { field: string; order: 'asc' | 'desc' };
            limit?: number;
            offset?: number;
        }) => Promise<JSONStorageDocument<T>[]>;
    }> {

        if (!this.directory) {
            throw new Error('Directory is not set');
        }

        const toReturn = {
            create: this.create,
            read: this.read,
            update: this.update,
            delete: this.delete,
            all: this.all,
            filter: this.filter,
        }

        return this.connectinQueue.enqueue(async () => {
            try {
                await fs.access(this.directory, fs.constants.R_OK | fs.constants.W_OK);
            } catch {
                await fs.mkdir(this.directory, { recursive: true });
            }
            return toReturn;
        });
    }

    private async create(data: Record<string, any>): Promise<{
        _id: string;
        path: string;
    }> {
        const _id = data._id || crypto.randomUUID();
        const path = `${process.cwd()}/${this.directory}/${_id}.json`;
        const lockPath = `${process.cwd()}/${this.directory}/${_id}.lock`;

        await fs.mkdir(lockPath);

        try {
            await fs.writeFile(path, JSON.stringify({
                ...data
            }), { flag: 'wx' });
            await fs.rm(lockPath);
            return {
                _id,
                path,
            }
        } catch (e) {
            await fs.rm(lockPath);
            throw e;
        }
    }

    private async update(fileId: string, data: Record<string, any>): Promise<{
        _id: string;
        path: string;
    }> {
        const path = `${process.cwd()}/${this.directory}/${fileId}.json`;
        const lockPath = `${process.cwd()}/${this.directory}/${fileId}.lock`;

        if (data._id) {
            throw new Error('Cannot update _id field');
        }

        await fs.mkdir(lockPath);

        try {
            await fs.access(path, fs.constants.F_OK);
            await fs.writeFile(path, JSON.stringify(data), { flag: 'w' });
            await fs.rm(lockPath);
            return {
                _id: fileId,
                path,
            }
        } catch (e) {
            await fs.rm(lockPath);
            throw e;
        }
    }

    private async read(fileId: string): Promise<JSONStorageDocument> {
        const path = `${process.cwd()}/${this.directory}/${fileId}.json`;
        try {
            const stats = await fs.stat(path);
            const data = await fs.readFile(path, 'utf8');
            return {
                ...JSON.parse(data),
                _id: fileId,
                stats,
            }
        } catch (e) {
            throw e;
        }
    }

    private async delete(fileId: string): Promise<void> {
        const path = `${process.cwd()}/${this.directory}/${fileId}.json`;
        const lockPath = `${process.cwd()}/${this.directory}/${fileId}.lock`;

        await fs.mkdir(lockPath);

        try {
            await fs.access(path, fs.constants.F_OK);
            await fs.unlink(path);
            await fs.rm(lockPath);
        } catch (e) {
            await fs.rm(lockPath);
            throw e;
        }
    }

    private async all(): Promise<JSONStorageDocument[]> {
        const dirPath = `${process.cwd()}/${this.directory}`;
        const fileEntries = await fs.readdir(dirPath, { withFileTypes: true });
        const jsonFiles = fileEntries.filter(file => file.isFile() && file.name.endsWith('.json'));
        const fileContents = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = `${dirPath}/${file.name}`;
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                const stats = await fs.stat(filePath);
                return {
                    ...data,
                    _id: file.name.replace('.json', ''),
                    stats,
                }
            })
        );
        return fileContents as JSONStorageDocument[];
    }

    private async filter(options: {
        where?: Record<string, Filter | string | number | boolean>;
        sort?: { field: string; order: 'asc' | 'desc' };
        limit?: number;
        offset?: number;
    } = {}): Promise<JSONStorageDocument[]> {
        function evaluateFilter(value: any, filter: Filter): boolean {
            if (filter.$gt !== undefined) return value > filter.$gt;
            if (filter.$gte !== undefined) return value >= filter.$gte;
            if (filter.$lt !== undefined) return value < filter.$lt;
            if (filter.$lte !== undefined) return value <= filter.$lte;
            if (filter.$regex !== undefined) return new RegExp(filter.$regex).test(value);

            if (Array.isArray(value)) {
                if (filter.$in !== undefined) return filter.$in.some(item => value.includes(item));
                if (filter.$nin !== undefined) return !filter.$nin.some(item => value.includes(item));
            }

            if (filter.$in !== undefined) return filter.$in.includes(value);
            if (filter.$nin !== undefined) return !filter.$nin.includes(value);
            if (filter.$ne !== undefined) return value !== filter.$ne;
            if (filter.$eq !== undefined) return value === filter.$eq;

            if (filter.$or !== undefined) {
                return filter.$or.some(item => evaluateFilter(value, item));
            }
            if (filter.$and !== undefined) {
                return filter.$and.every(item => evaluateFilter(value, item));
            }
            if (filter.$not !== undefined) {
                return !evaluateFilter(value, filter.$not);
            }

            return true;
        }

        const dirPath = `${process.cwd()}/${this.directory}`;
        const fileEntries = await fs.readdir(dirPath, { withFileTypes: true });
        const jsonFiles = fileEntries.filter(file => file.isFile() && file.name.endsWith('.json'));

        let fileContents = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = `${dirPath}/${file.name}`;
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                const stats = await fs.stat(filePath);
                return {
                    _id: file.name.replace('.json', ''),
                    ...data,
                    stats,
                }
            })
        );

        if (options.where) {
            fileContents = fileContents.filter(item => {
                return Object.entries(options.where!).every(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        return evaluateFilter(item[key], value);
                    }
                    return item[key] === value;
                });
            });
        }

        if (options.sort) {
            fileContents.sort((a, b) => {
                const aVal = a[options.sort!.field];
                const bVal = b[options.sort!.field];

                if (options.sort!.order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        if (options.offset) {
            fileContents = fileContents.slice(options.offset);
        }
        if (options.limit) {
            fileContents = fileContents.slice(0, options.limit);
        }

        return fileContents;
    }
}

export default JSONStorage;