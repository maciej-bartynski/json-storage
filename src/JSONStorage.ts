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

    /**
     * Establishes connection to the storage directory and returns CRUD interface.
     * 
     * This method performs the following operations:
     * 1. Validates that directory is set
     * 2. Checks if directory exists and has read/write permissions
     * 3. If directory doesn't exist or lacks permissions, attempts to create it
     * 4. Uses connection queue to prevent concurrent initialization
     * 
     * The method is designed to be resilient - it will automatically create the directory
     * if it doesn't exist, including all necessary parent directories. Errors are only
     * thrown in specific failure scenarios where the directory cannot be created.
     * 
     * @returns Promise resolving to an object containing CRUD methods: create, read, update, delete, all, filter
     * @throws {Error} When directory is not set
     * @throws {Error} When directory cannot be created due to insufficient permissions (EACCES)
     * @throws {Error} When directory cannot be created due to insufficient disk space (ENOSPC)
     * @throws {Error} When path is invalid or contains invalid characters (EINVAL)
     * @throws {Error} When other filesystem errors prevent directory creation
     */
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

    /**
     * Creates a new JSON document in the storage directory.
     * 
     * This method performs the following operations:
     * 1. Generates UUID if _id is not provided in data
     * 2. Creates a lock directory to prevent concurrent access
     * 3. Writes JSON data to file with exclusive flag
     * 4. Removes lock directory after successful write
     * 
     * @param data - The data to store as JSON document
     * @param data._id - Optional custom ID (if not provided, UUID will be generated)
     * @returns Promise resolving to object containing _id and file path
     * @throws {Error} When file already exists (EEXIST)
     * @throws {Error} When lock directory cannot be created (concurrent access)
     * @throws {Error} When file cannot be written
     */
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
            await fs.rm(lockPath, { recursive: true });
            return {
                _id,
                path,
            }
        } catch (e) {
            await fs.rm(lockPath, { recursive: true });
            throw e;
        }
    }

    /**
     * Updates an existing JSON document in the storage directory.
     * 
     * This method performs the following operations:
     * 1. Validates that _id field is not being updated (not allowed)
     * 2. Creates a lock directory to prevent concurrent access
     * 3. Checks if file exists before updating
     * 4. Overwrites file content with new data
     * 5. Removes lock directory after successful update
     * 
     * @param fileId - The ID of the file to update (used as filename)
     * @param data - The new data to replace existing content
     * @returns Promise resolving to object containing _id and file path
     * @throws {Error} When _id field is provided in data (not allowed)
     * @throws {Error} When file does not exist (ENOENT)
     * @throws {Error} When lock directory cannot be created (concurrent access)
     * @throws {Error} When file cannot be written
     */
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
            await fs.rm(lockPath, { recursive: true });
            return {
                _id: fileId,
                path,
            }
        } catch (e) {
            await fs.rm(lockPath, { recursive: true });
            throw e;
        }
    }

    /**
     * Reads a JSON document from the storage directory.
     * 
     * This method reads the file content and returns it as a JSONStorageDocument
     * which includes the original data plus metadata like _id and file stats.
     * 
     * @param fileId - The ID of the file to read (used as filename)
     * @returns Promise resolving to JSONStorageDocument containing file data and metadata
     * @throws {Error} When file does not exist (ENOENT)
     * @throws {Error} When file cannot be read
     * @throws {Error} When file contains invalid JSON
     */
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

    /**
     * Deletes a JSON document from the storage directory.
     * 
     * This method performs the following operations:
     * 1. Creates a lock directory to prevent concurrent access
     * 2. Checks if file exists before deletion
     * 3. Removes the JSON file from storage
     * 4. Removes lock directory after successful deletion
     * 
     * @param fileId - The ID of the file to delete (used as filename)
     * @returns Promise resolving to void
     * @throws {Error} When file does not exist (ENOENT)
     * @throws {Error} When lock directory cannot be created (concurrent access)
     * @throws {Error} When file cannot be deleted
     */
    private async delete(fileId: string): Promise<void> {
        const path = `${process.cwd()}/${this.directory}/${fileId}.json`;
        const lockPath = `${process.cwd()}/${this.directory}/${fileId}.lock`;

        await fs.mkdir(lockPath);

        try {
            await fs.access(path, fs.constants.F_OK);
            await fs.unlink(path);
            await fs.rm(lockPath, { recursive: true });
        } catch (e) {
            await fs.rm(lockPath, { recursive: true });
            throw e;
        }
    }

    /**
     * Retrieves all JSON documents from the storage directory.
     * 
     * This method reads all .json files in the storage directory and returns
     * them as an array of JSONStorageDocument objects. Each document includes
     * the original data plus metadata like _id and file stats.
     * 
     * @returns Promise resolving to array of JSONStorageDocument objects
     * @throws {Error} When directory cannot be read
     * @throws {Error} When any file contains invalid JSON
     */
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

    /**
     * Filters and retrieves JSON documents from the storage directory.
     * 
     * This method provides MongoDB-like filtering capabilities with support for:
     * - Comparison operators: $eq, $ne, $gt, $gte, $lt, $lte
     * - Array operators: $in, $nin
     * - String operators: $regex
     * - Logical operators: $and, $or, $not
     * - Sorting by field with asc/desc order
     * - Pagination with limit and offset
     * 
     * @param options - Filter options object
     * @param options.where - Filter conditions (MongoDB-like syntax)
     * @param options.sort - Sorting options { field: string, order: 'asc' | 'desc' }
     * @param options.limit - Maximum number of results to return
     * @param options.offset - Number of results to skip (for pagination)
     * @returns Promise resolving to filtered array of JSONStorageDocument objects
     * @throws {Error} When directory cannot be read
     * @throws {Error} When any file contains invalid JSON
     * @throws {Error} When filter syntax is invalid
     */
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