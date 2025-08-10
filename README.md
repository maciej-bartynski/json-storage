# @bartek01001/json-storage

A Node.js service for managing CRUD operations on JSON files with MongoDB-like filtering capabilities.

## Overview

JSON Storage provides a simple, file-based storage solution that mimics database operations. It automatically handles file locking, concurrent access control, and provides a familiar query interface similar to MongoDB.

**Key Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- MongoDB-like filtering with operators ($eq, $gt, $lt, $in, $regex, etc.)
- Automatic file locking for concurrent access safety
- TypeScript support with full type definitions
- ESM module format

## Installation

```bash
npm install @bartek01001/json-storage
```

## Quick Start

```typescript
import JSONStorage from '@bartek01001/json-storage';

// Initialize storage
const storage = new JSONStorage({ directory: './data' });

// Connect and get CRUD interface
const db = await storage.connect();

// Create a document
const user = await db.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Read a document
const userDoc = await db.read(user._id);

// Update a document
await db.update(user._id, { age: 31 });

// Filter documents
const adults = await db.filter({
  where: { age: { $gte: 18 } },
  sort: { field: 'age', order: 'desc' }
});

// Delete a document
await db.delete(user._id);
```

## Technical Stack

- **Language**: TypeScript 5.8.3
- **Runtime**: Node.js (ES2024 target)
- **Module System**: ESM
- **Testing**: Vitest
- **Build Tool**: TypeScript Compiler

## Documentation

For detailed development setup, testing, and deployment instructions, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

MIT
