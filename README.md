# @bartek01001/json-storage

A Node.js service for managing CRUD operations on JSON files with MongoDB-like filtering capabilities.

## Overview

JSON Storage provides a simple, file-based storage solution that mimics database operations. It automatically handles file locking, concurrent access control, and provides a familiar query interface similar to MongoDB.

**Key Features:**
- **Singleton Pattern**: Single instance per process for efficient resource management
- **Multi-Directory Support**: Manage multiple subdirectories from one instance
- **Connection Queuing**: Automatic queuing for concurrent access to the same subdirectory
- **Full CRUD Operations**: Create, Read, Update, Delete with MongoDB-like filtering
- **Advanced Filtering**: Support for operators ($eq, $gt, $lt, $in, $regex, etc.)
- **Automatic File Locking**: Concurrent access safety with lock directories
- **TypeScript Support**: Full type definitions and type safety
- **ESM Module Format**: Modern ES modules support

## Installation

```bash
npm install @bartek01001/json-storage
```

## Quick Start

```typescript
import JSONStorage from '@bartek01001/json-storage';

// Get singleton instance
const jsonStorage = JSONStorage.getInstance({ directory: './data' });

// Connect to specific subdirectory and get CRUD interface
const itemStorage = await jsonStorage.connect('items');
const userStorage = await jsonStorage.connect('users');

// Create a document
const user = await itemStorage.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Read a document
const userDoc = await itemStorage.read(user._id);

// Update a document
await itemStorage.update(user._id, { age: 31 });

// Filter documents
const adults = await itemStorage.filter({
  where: { age: { $gte: 18 } },
  sort: { field: 'age', order: 'desc' }
});

// Delete a document
await itemStorage.delete(user._id);
```

## API Overview

### Singleton Pattern
JSONStorage now uses a singleton pattern, ensuring only one instance exists per process. This provides:
- **Resource Efficiency**: Single instance manages all subdirectories
- **Consistent Configuration**: Base directory configured once
- **Memory Optimization**: No duplicate instances

### Multi-Directory Management
Connect to different subdirectories while maintaining separate connection queues:
```typescript
const jsonStorage = JSONStorage.getInstance({ directory: './storage' });

// Each subdirectory has its own connection queue
const items = await jsonStorage.connect('items');
const users = await jsonStorage.connect('users');
const products = await jsonStorage.connect('products');

// Operations on different subdirectories don't block each other
// But operations on the same subdirectory are properly queued
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
