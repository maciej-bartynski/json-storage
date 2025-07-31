# JSON Storage

A lightweight, file-based JSON storage solution for Node.js with TypeScript support, featuring CRUD operations, advanced filtering, and file locking for concurrent access safety.

## Installation

```bash
npm install @bartek01001/json-storage
```

## Usage

### Basic Setup

```typescript
import JSONStorage from '@bartek01001/json-storage';

const storage = new JSONStorage({ directory: './data' });
const connection = await storage.connect();
```

### CRUD Operations

```typescript
// Create a new document
const result = await connection.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
});
console.log(result._id); // Auto-generated UUID
console.log(result.path); // File path

// Read a document
const document = await connection.read(result._id);
console.log(document); // { _id: '...', name: 'John Doe', email: '...', age: 30, stats: {...} }

// Update a document
await connection.update(result._id, {
    age: 31,
    lastModified: new Date().toISOString()
});

// Delete a document
await connection.delete(result._id);

// Get all documents
const allDocuments = await connection.all();
```

### Advanced Filtering

```typescript
// Filter by exact match
const users = await connection.filter({
    where: { name: 'John Doe' }
});

// Filter by numeric comparison
const adults = await connection.filter({
    where: { age: { $gte: 18 } }
});

// Filter by regex pattern
const johns = await connection.filter({
    where: { name: { $regex: '^John' } }
});

// Filter by array inclusion
const activeUsers = await connection.filter({
    where: { status: { $in: ['active', 'pending'] } }
});

// Complex filtering with multiple conditions
const results = await connection.filter({
    where: {
        age: { $gte: 18, $lt: 65 },
        status: 'active',
        email: { $regex: '@gmail.com$' }
    },
    sort: { field: 'age', order: 'desc' },
    limit: 10,
    offset: 5
});
```

### Filter Operators

The library supports MongoDB-like filter operators:

- **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- **Array**: `$in`, `$nin`
- **String**: `$regex`
- **Logical**: `$and`, `$or`, `$not`

## Features

- **File-based Storage**: Each document is stored as a separate JSON file
- **Concurrent Access Safety**: File locking prevents data corruption during simultaneous operations
- **Advanced Filtering**: MongoDB-like query syntax for complex data retrieval
- **TypeScript Support**: Full type safety and IntelliSense support
- **Lightweight**: Minimal dependencies, only requires Node.js built-ins
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Sorting & Pagination**: Built-in support for sorting and limiting results
- **ESM Support**: Modern ES modules support for Node.js

## API Reference

### Constructor

```typescript
new JSONStorage({ directory: string })
```

### Connection Methods

```typescript
const connection = await storage.connect();
```

### CRUD Methods

- `create(data: Record<string, any>): Promise<{ _id: string; path: string }>`
- `read(fileId: string): Promise<JSONStorageDocument>`
- `update(fileId: string, data: Record<string, any>): Promise<{ _id: string; path: string }>`
- `delete(fileId: string): Promise<void>`
- `all(): Promise<Record<string, any>[]>`

### Filter Method

```typescript
filter<T = any>(options: {
    where?: Record<string, Filter | string | number | boolean>;
    sort?: { field: string; order: 'asc' | 'desc' };
    limit?: number;
    offset?: number;
}): Promise<JSONStorageDocument<T>[]>
```

## Error Handling

```typescript
try {
    const result = await connection.create({ name: 'Test' });
} catch (error) {
    if (error.code === 'EEXIST') {
        console.log('File already exists');
    } else if (error.code === 'ENOENT') {
        console.log('File not found');
    }
}
```

## Development

For developers working on this package, see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for detailed technical documentation, project structure, configuration details, and development workflow.

## License

MIT 