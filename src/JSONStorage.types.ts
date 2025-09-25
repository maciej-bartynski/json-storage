import { Stats } from "fs";

type JSONStorageDocument<T = any> = {
    _id: string;
    stats: Stats;
} & T;

type Filter = {
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
    $regex?: string | RegExp;
    $in?: (string | number | boolean)[];
    $nin?: (string | number | boolean)[];
    $eq?: string | number | boolean;
    $ne?: string | number | boolean;
    $or?: Filter[];
    $and?: Filter[];
    $not?: Filter;
}

type ConnectOptions = {
    directory: string;
    maxFileAmount?: number;
};

type FileMetadata = {
    _id: string;
    createdAt: string;
    updatedAt: string;
};

type DirectoryStats = {
    amount: number;
    createdAsc: FileMetadata[];
    updatedAsc: FileMetadata[];
};

type CRUDInterface = {
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
};

export type { JSONStorageDocument, Filter, ConnectOptions, FileMetadata, DirectoryStats, CRUDInterface };