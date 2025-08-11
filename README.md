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
- **File Limit Management**: Optional maxFileAmount parameter for automatic cleanup of oldest files
- **Directory Statistics**: getStats method for file count and metadata analysis
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

// Connect with file limit management
const logStorage = await jsonStorage.connect({ directory: 'logs', maxFileAmount: 1000 });

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

// Get directory statistics
const stats = await itemStorage.getStats();
console.log(`Directory contains ${stats.amount} files`);
console.log('Oldest files:', stats.createdAsc.slice(0, 3));
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

// Connect with file limit management
const logs = await jsonStorage.connect({ directory: 'logs', maxFileAmount: 1000 });

// Operations on different subdirectories don't block each other
// But operations on the same subdirectory are properly queued
```

### File Limit Management
Automatically manage file counts in subdirectories with the `maxFileAmount` parameter:
```typescript
// Connect with automatic file cleanup
const logStorage = await jsonStorage.connect({ 
    directory: 'application-logs', 
    maxFileAmount: 100 
});

// When creating new files, oldest files are automatically removed
// to maintain the specified limit
await logStorage.create({ message: 'New log entry', timestamp: Date.now() });

// Get current statistics
const stats = await logStorage.getStats();
console.log(`Directory contains ${stats.amount} files`);
console.log('Files sorted by creation time:', stats.createdAsc);
console.log('Files sorted by modification time:', stats.updatedAsc);
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
