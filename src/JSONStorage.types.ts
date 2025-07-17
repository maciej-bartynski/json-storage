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

export type { JSONStorageDocument, Filter };