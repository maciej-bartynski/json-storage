# @bartek01001/json-storage

A TypeScript library for managing CRUD operations on JSON files with MongoDB-like filtering capabilities.

## Overview

JSON Storage provides a file-based storage solution that mimics database operations. It handles file locking, concurrent access control, and provides a familiar query interface similar to MongoDB.

**Key Features:**
- **Singleton Pattern**: Single instance per process for efficient resource management
- **Multi-Directory Support**: Manage multiple subdirectories from one instance
- **MongoDB-like Filtering**: Advanced query operators ($eq, $gt, $lt, $in, $regex, etc.)
- **File Limit Management**: Automatic cleanup of oldest files with maxFileAmount
- **Concurrent Access Safety**: File locking and connection queuing
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

// Connect to subdirectories
const items = await jsonStorage.connect('items');
const users = await jsonStorage.connect('users');

// CRUD operations
const user = await users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

const userDoc = await users.read(user._id);
await users.update(user._id, { age: 31 });

// MongoDB-like filtering
const adults = await users.filter({
  where: { age: { $gte: 18 } },
  sort: { field: 'age', order: 'desc' }
});

await users.delete(user._id);
```

## API Overview

### Singleton Pattern
Single instance per process manages all subdirectories efficiently.

### Multi-Directory Management
```typescript
const jsonStorage = JSONStorage.getInstance({ directory: './storage' });

// Connect to different subdirectories
const items = await jsonStorage.connect('items');
const users = await jsonStorage.connect('users');

// With file limit management
const logs = await jsonStorage.connect({ 
    directory: 'logs', 
    maxFileAmount: 1000 
});
```

### File Limit Management
```typescript
// Automatic cleanup of oldest files
const logStorage = await jsonStorage.connect({ 
    directory: 'logs', 
    maxFileAmount: 100 
});

// Get directory statistics
const stats = await logStorage.getStats();
console.log(`Directory contains ${stats.amount} files`);
```

## Requirements

- **Node.js**: 18+ (ES2024 support required)
- **TypeScript**: 5.8.3+ (if using TypeScript)
- **Module System**: ESM (ES Modules)

## Documentation

For detailed development setup, testing, and deployment instructions, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

MIT
