# JSON Storage

A lightweight Node.js service for managing CRUD operations on JSON files with MongoDB-like filtering capabilities.

## Features

- **CRUD Operations**: Create, read, update, and delete JSON documents
- **MongoDB-like Filtering**: Advanced querying with comparison operators, array operators, and logical operators
- **Concurrent Access Protection**: File-level locking mechanism prevents data corruption
- **TypeScript Support**: Full TypeScript definitions included
- **ESM Module**: Modern ES modules support
- **Zero Dependencies**: Minimal external dependencies

## Installation

```bash
npm install @bartek01001/json-storage
```

## Quick Start

```typescript
import JSONStorage from '@bartek01001/json-storage';

const storage = new JSONStorage({ directory: './data' });
const connection = await storage.connect();

// Create a document
const result = await connection.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Read a document
const document = await connection.read(result._id);

// Update a document
await connection.update(result._id, { age: 31 });

// Delete a document
await connection.delete(result._id);

// Get all documents
const allDocuments = await connection.all();

// Filter documents
const filtered = await connection.filter({
  where: { age: { $gte: 25 } },
  sort: { field: 'name', order: 'asc' },
  limit: 10
});
```

## Filtering Operators

- **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- **Array**: `$in`, `$nin`
- **String**: `$regex`
- **Logical**: `$and`, `$or`, `$not`

## License

MIT

