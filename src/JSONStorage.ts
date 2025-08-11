import * as fs from "fs/promises";
import { JSONStorageDocument, Filter, FileMetadata, DirectoryStats } from "#src/JSONStorage.types.js";
import AsyncTasksQueue from "@bartek01001/async-tasks-queue";
import * as crypto from "crypto";

class JSONStorage {
    private static instance: JSONStorage | null = null;
    private baseDirectory: string;
    private subdirectoryQueues = new Map<string, AsyncTasksQueue>();

    private constructor(params: {
        directory: string;
    }) {
        this.baseDirectory = params.directory;
    }

    public static getInstance(params: {
        directory: string;
    }): JSONStorage {
        if (!JSONStorage.instance) {
            JSONStorage.instance = new JSONStorage(params);
        }
        return JSONStorage.instance;
    }

    public static resetInstance(): void {
        JSONStorage.instance = null;
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
     * @param options - Connection options with directory and optional maxFileAmount
     * @returns Promise resolving to an object containing CRUD methods: create, read, update, delete, all, filter, getStats
     * @throws {Error} When directory is not set
     * @throws {Error} When directory cannot be created due to insufficient permissions (EACCES)
     * @throws {Error} When directory cannot be created due to insufficient disk space (ENOSPC)
     * @throws {Error} When path is invalid or contains invalid characters (EINVAL)
     * @throws {Error} When other filesystem errors prevent directory creation
     */
    async connect(options: string | { directory: string; maxFileAmount?: number }): Promise<{
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
        getStats: () => Promise<DirectoryStats>;
    }> {
        // Handle both string (backward compatibility) and object parameters
        if (!options) {
            throw new Error('Subdirectory is required');
        }

        const subdirectory = typeof options === 'string' ? options : options.directory;
        const maxFileAmount = typeof options === 'string' ? undefined : options.maxFileAmount;

        if (!this.baseDirectory) {
            throw new Error('Directory is not set');
        }

        if (!subdirectory) {
            throw new Error('Subdirectory is required');
        }

        if (!this.subdirectoryQueues.has(subdirectory)) {
            this.subdirectoryQueues.set(subdirectory, new AsyncTasksQueue());
        }

        const queue = this.subdirectoryQueues.get(subdirectory)!;
        const fullDirectory = `${this.baseDirectory}/${subdirectory}`;

        const crudInterface = {
            create: async (data: Record<string, any>): Promise<{
                _id: string;
                path: string;
            }> => {
                // Use createWithMaxAmountAllowed if maxFileAmount is set, otherwise use regular create
                if (maxFileAmount !== undefined) {
                    return this.createWithMaxAmountAllowed(subdirectory, data, maxFileAmount);
                } else {
                    return this.create(subdirectory, data);
                }
            },
            read: async (fileName: string): Promise<JSONStorageDocument> => {
                return this.read(subdirectory, fileName);
            },
            update: async (fileName: string, data: Record<string, any>): Promise<{
                _id: string;
                path: string;
            }> => {
                return this.update(subdirectory, fileName, data);
            },
            delete: async (fileName: string): Promise<void> => {
                return this.delete(subdirectory, fileName);
            },
            all: async (): Promise<Record<string, any>[]> => {
                return this.all(subdirectory);
            },
            filter: async <T = any>(options: {
                where?: Record<string, Filter | string | number | boolean>;
                sort?: { field: string; order: 'asc' | 'desc' };
                limit?: number;
                offset?: number;
            }) => {
                return this.filter(subdirectory, options);
            },
            getStats: async (): Promise<DirectoryStats> => {
                const dirPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}`;
                const fileEntries = await fs.readdir(dirPath, { withFileTypes: true });
                const jsonFiles = fileEntries.filter(file => file.isFile() && file.name.endsWith('.json'));

                const fileStats = await Promise.all(
                    jsonFiles.map(async (file) => {
                        const filePath = `${dirPath}/${file.name}`;
                        const stats = await fs.stat(filePath);
                        const content = await fs.readFile(filePath, 'utf8');
                        const fileData = JSON.parse(content);

                        return {
                            _id: fileData._id || file.name.replace('.json', ''),
                            createdAt: stats.birthtime.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            }),
                            updatedAt: stats.mtime.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            }),
                            stats
                        };
                    })
                );

                // Sort by creation time (birthtime) - oldest first
                const createdAsc = [...fileStats].sort((a, b) =>
                    a.stats.birthtime.getTime() - b.stats.birthtime.getTime()
                ).map(({ stats, ...rest }) => rest);

                // Sort by modification time (mtime) - oldest first
                const updatedAsc = [...fileStats].sort((a, b) =>
                    a.stats.mtime.getTime() - b.stats.mtime.getTime()
                ).map(({ stats, ...rest }) => rest);

                return {
                    amount: jsonFiles.length,
                    createdAsc,
                    updatedAsc
                };
            }
        };

        return queue.enqueue(async () => {
            try {
                await fs.access(fullDirectory, fs.constants.R_OK | fs.constants.W_OK);
            } catch {
                await fs.mkdir(fullDirectory, { recursive: true });
            }
            return crudInterface;
        });
    }



    /**
     * Creates a new JSON document in the storage directory with file amount limit enforcement.
     * 
     * This method automatically manages the number of files in the subdirectory:
     * 1. Counts current JSON files (excluding .lock files)
     * 2. If over the limit, removes oldest files (by creation time)
     * 3. Creates the new file
     * 
     * The method uses the existing AsyncTasksQueue to ensure sequential execution
     * and prevent conflicts when multiple operations try to count files simultaneously.
     * 
     * @param subdirectory - The subdirectory to create the file in
     * @param data - The data to store as JSON document
     * @param maxFileAmount - Maximum number of files allowed in the subdirectory
     * @returns Promise resolving to object containing _id and file path
     * @throws {Error} When file operations fail
     */
    private async createWithMaxAmountAllowed(
        subdirectory: string,
        data: Record<string, any>,
        maxFileAmount: number
    ): Promise<{
        _id: string;
        path: string;
    }> {
        const queue = this.subdirectoryQueues.get(subdirectory)!;

        return queue.enqueue(async () => {
            if (maxFileAmount === 0) {
                return {
                    _id: data._id || crypto.randomUUID(),
                    path: `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${data._id || crypto.randomUUID()}.json`
                };
            }

            const dirPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}`;
            const fileEntries = await fs.readdir(dirPath, { withFileTypes: true });
            const jsonFiles = fileEntries.filter(file => file.isFile() && file.name.endsWith('.json'));

            if (jsonFiles.length >= maxFileAmount) {
                const fileStats = await Promise.all(
                    jsonFiles.map(async (file) => {
                        const filePath = `${dirPath}/${file.name}`;
                        const stats = await fs.stat(filePath);
                        const content = await fs.readFile(filePath, 'utf8');
                        const fileData = JSON.parse(content);

                        return {
                            _id: fileData._id || file.name.replace('.json', ''),
                            stats
                        };
                    })
                );

                const createdAsc = [...fileStats].sort((a, b) =>
                    a.stats.birthtime.getTime() - b.stats.birthtime.getTime()
                );

                const filesToRemove = jsonFiles.length - maxFileAmount + 1;

                for (let i = 0; i < filesToRemove; i++) {
                    const fileToRemove = createdAsc[i];
                    if (fileToRemove) {
                        try {
                            await this.delete(subdirectory, fileToRemove._id);
                        } catch {
                        }
                    }
                }
            }

            return this.create(subdirectory, data);
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
    private async create(subdirectory: string, data: Record<string, any>): Promise<{
        _id: string;
        path: string;
    }> {
        const _id = data._id || crypto.randomUUID();
        const path = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${_id}.json`;
        const lockPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${_id}.lock`;

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
    private async update(subdirectory: string, fileId: string, data: Record<string, any>): Promise<{
        _id: string;
        path: string;
    }> {
        const path = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${fileId}.json`;
        const lockPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${fileId}.lock`;

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
    private async read(subdirectory: string, fileId: string): Promise<JSONStorageDocument> {
        const path = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${fileId}.json`;
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
    private async delete(subdirectory: string, fileId: string): Promise<void> {
        const path = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${fileId}.json`;
        const lockPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}/${fileId}.lock`;

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
    private async all(subdirectory: string): Promise<JSONStorageDocument[]> {
        const dirPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}`;
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
    private async filter(subdirectory: string, options: {
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

        const dirPath = `${process.cwd()}/${this.baseDirectory}/${subdirectory}`;
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