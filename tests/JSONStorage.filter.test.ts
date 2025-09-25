import * as fs from 'fs/promises';
import JSONStorage from '#src/JSONStorage.js';

describe('Field equality', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_equality' });
        connection = await testStorage.connect('test_filter_equality');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_equality`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_equality`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('By string field equality', async () => {
        const expectedAge = 50;
        const files = await connection.filter<TestFile>({ where: { name: `Frodo-${expectedAge}` } });
        expect(files.length).toBe(1);
        expect(files[0].stats).toBeDefined();
        expect(typeof files[0]._id).toBe('string');
        delete (files[0] as any).stats;
        delete (files[0] as any)._id;
        expect(files).toEqual([{
            name: `Frodo-${expectedAge}`,
            surname: `Baggins-${expectedAge}`,
            age: expectedAge,
            status: resolveStatusByAge(expectedAge),
            equipment: resolveEquipmentByAge(expectedAge),
        }]);
    });

    it('By number field equality', async () => {
        const expectedAge = 55;
        const files = await connection.filter<TestFile>({ where: { age: expectedAge } });
        delete (files[0] as any).stats;
        delete (files[0] as any)._id;
        expect(files).toEqual([{
            name: `Frodo-${expectedAge}`,
            surname: `Baggins-${expectedAge}`,
            age: expectedAge,
            status: resolveStatusByAge(expectedAge),
            equipment: resolveEquipmentByAge(expectedAge),
        }]);
    });
});

describe('Filtering by $regex', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_regex' });
        connection = await testStorage.connect('test_filter_regex');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_regex`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_regex`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('By search term', async () => {
        const files100 = await connection.filter({ where: { name: { $regex: 'Frodo' } } });
        expect(files100.length).toBe(100);
        const expectedAge = 52;
        const files1 = await connection.filter({ where: { name: { $regex: `rodo-${expectedAge}` } } });
        expect(files1.length).toBe(1);
        delete (files1[0] as any).stats;
        delete (files1[0] as any)._id;
        expect(files1[0]).toEqual({
            name: `Frodo-${expectedAge}`,
            surname: `Baggins-${expectedAge}`,
            age: expectedAge,
            status: resolveStatusByAge(expectedAge),
            equipment: resolveEquipmentByAge(expectedAge),
        });
    });

    it('By actual regex', async () => {
        const files9 = await connection.filter({ where: { name: { $regex: /^Frodo-[1-9]$/ } } });
        expect(files9.length).toBe(9);
        expect(files9.every(file => /^Frodo-[1-9]$/.test(file.name))).toBe(true);
    });
});

describe('Filtering by $in', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_in' });
        connection = await testStorage.connect('test_filter_in');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_in`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_in`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('By string field equal to one of the array strings', async () => {
        const files = await connection.filter<TestFile>({
            where: {
                name: {
                    $in: ['Frodo-50', 'Frodo-55', 'Frodo-60']
                }
            }
        });
        expect(files.length).toBe(3);
        expect(files.every(file => [50, 55, 60].includes(file.age))).toBe(true);
    });

    it('By number field equal to one of the array numbers', async () => {
        const files = await connection.filter<TestFile>({
            where: {
                age: {
                    $in: [50, 55, 60]
                }
            }
        });
        expect(files.length).toBe(3);
        expect(files.every(file => [50, 55, 60].includes(file.age))).toBe(true);
    });

    it('By array field contains one of the array values', async () => {
        const files = await connection.filter({ where: { equipment: { $in: ['ring'] } } });
        expect(files.length).toBe(69);
        expect(files.every(file => file.equipment.includes('ring'))).toBe(true);
    });
});

describe('Filtering by $nin', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_nin' });
        connection = await testStorage.connect('test_filter_nin');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_nin`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_nin`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('By array field not containing word "ring"', async () => {
        const files = await connection.filter({ where: { equipment: { $nin: ['ring'] } } });
        expect(files.length).toBe(31);
        expect(files.every(file => !file.equipment.includes('ring'))).toBe(true);
    });

    it('By array field not containing word "sword"', async () => {
        const files = await connection.filter({ where: { equipment: { $nin: ['sword'] } } });
        expect(files.length).toBe(51);
        expect(files.every(file => !file.equipment.includes('sword'))).toBe(true);
    });

    it('By array field not containing word "shield"', async () => {
        const files = await connection.filter({ where: { equipment: { $nin: ['shield'] } } });
        expect(files.length).toBe(61);
        expect(files.every(file => !file.equipment.includes('shield'))).toBe(true);
    });

    it('By array field not containing words "ring" and "shield"', async () => {
        const files = await connection.filter({ where: { equipment: { $nin: ['ring', 'shield'] } } });
        expect(files.length).toBe(11);
        expect(files.every(file => !file.equipment.includes('ring') && !file.equipment.includes('shield'))).toBe(true);
    });

    it('should filter by number field not equal', async () => {
        const files = await connection.filter({
            where: {
                age: { $ne: 50 }
            }
        });
        expect(files.length).toBe(99);
        expect(files.every(file => file.age !== 50)).toBe(true);
    });

    it('should filter by number field greater than', async () => {
        const files = await connection.filter({
            where: {
                age: {
                    $gt:
                        50
                }
            }
        });
        expect(files.length).toBe(50);
        expect(files.every(file => file.age > 50)).toBe(true);
    });

    it('should filter by number field greater than or equal', async () => {
        const files = await connection.filter({ where: { age: { $gte: 50 } } });
        expect(files.length).toBe(51);
        expect(files.every(file => file.age >= 50)).toBe(true);
        expect(files.some(file => file.age === 50)).toBe(true);
    });

    it('should filter by number field less than', async () => {
        const files = await connection.filter({ where: { age: { $lt: 10 } } });
        expect(files.length).toBe(9);
        expect(files.every(file => file.age < 10)).toBe(true);
    });

    it('Should filter by number field less than or equal', async () => {
        const files = await connection.filter({ where: { age: { $lte: 10 } } });
        expect(files.length).toBe(10);
        expect(files.every(file => file.age <= 10)).toBe(true);
        expect(files.some(file => file.age === 10)).toBe(true);
    });

    it('should filter by multiple fields', async () => {
        const files = await connection.filter({
            where: {
                age: { $gte: 50 },
                status: { $eq: 'active' }
            }
        });
        expect(files.length).toBe(25);
    });
});

describe('Filtering by math comparison: $ne, $gt, $gte, $lt, $lte', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_math' });
        connection = await testStorage.connect('test_filter_math');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_math`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_math`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('By number field not equal ($ne)', async () => {
        const files = await connection.filter({
            where: {
                age: { $ne: 50 }
            }
        });
        expect(files.length).toBe(99);
        expect(files.every(file => file.age !== 50)).toBe(true);
    });

    it('By number field greater than ($gt)', async () => {
        const files = await connection.filter({
            where: {
                age: {
                    $gt:
                        50
                }
            }
        });
        expect(files.length).toBe(50);
        expect(files.every(file => file.age > 50)).toBe(true);
    });

    it('By number field greater than or equal ($gte)', async () => {
        const files = await connection.filter({ where: { age: { $gte: 50 } } });
        expect(files.length).toBe(51);
        expect(files.every(file => file.age >= 50)).toBe(true);
        expect(files.some(file => file.age === 50)).toBe(true);
    });

    it('By number field less than ($lt)', async () => {
        const files = await connection.filter({ where: { age: { $lt: 10 } } });
        expect(files.length).toBe(9);
        expect(files.every(file => file.age < 10)).toBe(true);
    });

    it('By number field less than or equal ($lte)', async () => {
        const files = await connection.filter({ where: { age: { $lte: 10 } } });
        expect(files.length).toBe(10);
        expect(files.every(file => file.age <= 10)).toBe(true);
        expect(files.some(file => file.age === 10)).toBe(true);
    });

    it('should filter by multiple fields', async () => {
        const files = await connection.filter({
            where: {
                age: { $gte: 50 },
                status: { $eq: 'active' }
            }
        });
        expect(files.length).toBe(25);
    });
});

describe('Filtering by combining filters with $and', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_and' });
        connection = await testStorage.connect('test_filter_and');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_and`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_and`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('From $gt to $lt', async () => {
        const files = await connection.filter({
            where: {
                age: { $and: [{ $gt: 50 }, { $lt: 60 }] }
            }
        });
        expect(files.length).toBe(9);
        expect(files.every(file => file.age > 50 && file.age < 60)).toBe(true);
    });

    it('From $gte to $lte', async () => {
        const files = await connection.filter({
            where: {
                age: { $and: [{ $gte: 50 }, { $lte: 60 }] }
            }
        });
        expect(files.length).toBe(11);
        expect(files.every(file => file.age >= 50 && file.age <= 60)).toBe(true);
    });

    it('Contains ring OR shield, but not sword', async () => {
        const files = await connection.filter({
            where: {
                equipment: { $and: [{ $in: ['ring', 'shield'] }, { $nin: ['sword'] }] }
            }
        });
        expect(files.length).toBe(50);
        expect(files.every(file => file.equipment.includes('ring') || file.equipment.includes('shield') && !file.equipment.includes('sword'))).toBe(true);
    });

    it('Contains ring AND shield, but not sword', async () => {
        const files = await connection.filter({
            where: {
                equipment: {
                    $and: [
                        { $in: ['ring'] },
                        { $in: ['shield'] },
                        { $nin: ['sword'] }]
                }
            }
        });
        expect(files.length).toBe(10);
        expect(files.every(file => file.equipment.includes('ring') || file.equipment.includes('shield') && !file.equipment.includes('sword'))).toBe(true);
    });
});

describe('Filtering by combining filters with $or', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_or' });
        connection = await testStorage.connect('test_filter_or');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_or`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_or`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('To $lt, and then from $gt', async () => {
        const files = await connection.filter({
            where: {
                age: { $or: [{ $gt: 90 }, { $lt: 2 }] }
            }
        });
        expect(files.length).toBe(11);
        expect(files.every(file => file.age > 90 || file.age < 2)).toBe(true);
    });
    it('Contains ring, or ring AND shield, but not alone shiled, and each case not with sword', async () => {
        const files = await connection.filter({
            where: {
                equipment: {
                    $or: [
                        {
                            $and: [
                                { $in: ['ring'] },
                                { $nin: ['sword'] },
                                { $nin: ['shield'] }
                            ]
                        },
                        {
                            $and: [
                                { $in: ['ring'] },
                                { $in: ['shield'] },
                                { $nin: ['sword'] }
                            ]
                        }
                    ]
                }
            }
        });
        expect(files.length).toBe(35);
        expect(files.every(file => {
            const hasSword = file.equipment.includes('sword');
            const hasRing = file.equipment.includes('ring');
            const hasShield = file.equipment.includes('shield');

            const hasRingOnly = hasRing && !hasShield && !hasSword;
            const hasRingAndShieldOnly = hasRing && hasShield && !hasSword;

            return hasRingOnly || hasRingAndShieldOnly;
        })).toBe(true);
    });
});

describe('Filtering by combining filters with $not', () => {
    let testStorage: JSONStorage;
    let connection: Awaited<ReturnType<typeof testStorage.connect>>

    beforeAll(async () => {
        testStorage = JSONStorage.getInstance({ directory: 'test_filter_not' });
        connection = await testStorage.connect('test_filter_not');

        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_not`;

        for (let i = MIN_ORDER; i <= MAX_ORDER; i++) {
            const file: TestFile = {
                name: `Frodo-${resolveAgeByOrder(i)}`,
                surname: `Baggins-${resolveAgeByOrder(i)}`,
                age: resolveAgeByOrder(i),
                status: resolveStatusByAge(resolveAgeByOrder(i)),
                equipment: resolveEquipmentByAge(resolveAgeByOrder(i)),
            }
            await fs.writeFile(`${dirPath}/test-file-${i}.json`, JSON.stringify(file), { flag: 'wx' });
        }
    });

    afterAll(async () => {
        const dir = testStorage['baseDirectory'];
        const dirPath = `${process.cwd()}/${dir}/test_filter_not`;
        await fs.rm(dirPath, { recursive: true });
    });

    it('To $lt, and then from $gt, but not 92', async () => {
        const files = await connection.filter({
            where: {
                age: {
                    $and: [
                        { $or: [{ $gt: 90 }, { $lt: 2 }] },
                        { $not: { $in: [92] } }
                    ]
                }
            }
        });
        expect(files.length).toBe(10);
        expect(files.every(file => file.age > 90 || file.age < 2 && file.age !== 92)).toBe(true);
    });

    it('Not contains 5 in name', async () => {
        const files = await connection.filter({
            where: {
                name: { $not: { $regex: '5' } }
            }
        });
        expect(files.length).toBe(81);
        expect(files.every(file => !file.name.includes('5'))).toBe(true);
    });
});

const MIN_ORDER = 0;
const MAX_ORDER = 99;

const resolveStatusByAge = (age: number): ('active' | 'inactive') => {
    const iterationOrder = resolveOrderByAge(age);
    return ['active', 'inactive'][iterationOrder % 2] as ('active' | 'inactive')
}

const resolveEquipmentByAge = (age: number): ('ring' | 'sword' | 'shield')[] => {
    const iterationOrder = resolveOrderByAge(age);

    if (iterationOrder < 25) {
        return ['ring']
    }

    if (iterationOrder < 35) {
        return ['sword']
    }

    if (iterationOrder < 50) {
        return ['shield']
    }

    if (iterationOrder < 75) {
        return ['ring', 'sword']
    }

    if (iterationOrder < 80) {
        return ['sword', 'shield']
    }

    if (iterationOrder < 90) {
        return ['ring', 'shield']
    }

    if (iterationOrder < 99) {
        return ['ring', 'sword', 'shield']
    }

    return []
}

const resolveAgeByOrder = (order: number): number => {
    return order + 1;
}

const resolveOrderByAge = (age: number): number => {
    const iterationOrder = age - 1;
    return iterationOrder;
}

type TestFile = {
    name: string;
    surname: string;
    age: number;
    status: ('active' | 'inactive');
    equipment: ('ring' | 'sword' | 'shield')[];
}