# JSON Storage - AI Development Guide

## Package Overview

**@bartek01001/json-storage** is a TypeScript npm package that provides a lightweight, file-based JSON storage solution for Node.js. It offers CRUD operations, advanced filtering with MongoDB-like syntax, and file locking for concurrent access safety.

### Core Functionality
- **File-based Storage**: Each document is stored as a separate JSON file
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Advanced Filtering**: MongoDB-like query syntax with operators like `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex`, `$and`, `$or`, `$not`
- **Concurrent Access Safety**: File locking prevents data corruption during simultaneous operations
- **TypeScript Support**: Full type definitions and IntelliSense support
- **Sorting & Pagination**: Built-in support for sorting and limiting results

## Project Structure

```
json-storage/
├── src/
│   ├── JSONStorage.ts         # Main class implementation
│   └── JSONStorage.types.ts   # TypeScript type definitions
├── tests/
│   ├── JSONStorge.test.ts     # CRUD operations test suite
│   └── JSONStorage.filter.test.ts # Advanced filtering test suite
├── docs/
│   └── DEVELOPMENT.md         # This file
├── dist/                      # Compiled JavaScript + type definitions
├── index.ts                   # Main export file
├── package.json               # NPM package configuration
├── tsconfig.json              # TypeScript config (development + tests)
├── tsconfig.build.json        # TypeScript config (production build)
├── jest.config.js             # Jest test configuration
└── README.md                  # User documentation
```

## Configuration Files

### TypeScript Configuration

**tsconfig.json** (Development + Tests):
- Includes both `src/` and `tests/` directories
- Enables path aliases: `@/*` → `src/*`, `@tests/*` → `tests/*`
- Generates source maps and declaration maps
- Strict type checking enabled

**tsconfig.build.json** (Production Build):
- Excludes `tests/` directory
- Only compiles source code for npm package
- Used by `npm run build` command

### Jest Configuration

**jest.config.js**:
- Uses `ts-jest` for TypeScript support
- Maps path aliases for tests: `@/` → `src/`
- Node.js test environment
- Runs tests sequentially with `--runInBand` to avoid file system conflicts

## Available Commands

### Development Commands
```bash
npm run dev          # Run tests in watch mode
npm test             # Run tests once
npm run build        # Compile TypeScript to dist/
```

### Publishing Commands
```bash
npm run prepublishOnly  # Auto-runs before npm publish
npm pack               # Create local package for testing
npm publish            # Publish to npm registry
```

## Working with the Package

### For AI Assistants

**When modifying the source code:**
1. **Location**: Main implementation is in `src/JSONStorage.ts`
2. **Types**: Type definitions are in `src/JSONStorage.types.ts`
3. **Exports**: Main export is in `index.ts`
4. **Testing**: Always run `npm test` after changes
5. **Building**: Use `npm run build` to compile changes

**When adding new features:**
1. **Implementation**: Add to `src/JSONStorage.ts`
2. **Types**: Update `src/JSONStorage.types.ts` if new types are needed
3. **Tests**: Add corresponding tests in appropriate test files:
   - CRUD operations → `tests/JSONStorge.test.ts`
   - Filtering features → `tests/JSONStorage.filter.test.ts`
4. **Documentation**: Update `README.md` if API changes

**When fixing bugs:**
1. **Reproduce**: Create test case in appropriate test file
2. **Fix**: Modify `src/JSONStorage.ts` or `src/JSONStorage.types.ts`
3. **Verify**: Run `npm test` to ensure all tests pass
4. **Build**: Run `npm run build` to compile

### Key Implementation Details

**JSONStorage Class:**
- **Private directory**: Storage directory path
- **Private connectinQueue**: AsyncTasksQueue for connection management
- **connect()**: Establishes connection with file locking
- **CRUD methods**: create, read, update, delete, all
- **filter()**: Advanced filtering with MongoDB-like syntax

**File Locking Mechanism:**
- Uses directory-based locks (`.lock` folders)
- Prevents concurrent access to same file
- Automatic lock cleanup in try-catch blocks
- Ensures data integrity during concurrent operations

**Filter System:**
- **evaluateFilter()**: Recursive function for complex filter evaluation
- **Supported operators**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex`, `$and`, `$or`, `$not`
- **Array support**: Handles both array fields and array operators
- **Regex support**: String and RegExp pattern matching

**Path Aliases:**
- `@/JSONStorage` → `src/JSONStorage.ts`
- `@/JSONStorage.types` → `src/JSONStorage.types.ts`
- `@tests/*` → `tests/*`
- Configured in both TypeScript and Jest

**Test Strategy:**
- **CRUD tests**: Verify create, read, update, delete operations
- **Concurrency tests**: Test file locking and concurrent access
- **Filter tests**: Comprehensive testing of all filter operators
- **Error handling**: Test various error scenarios
- **Type safety**: Ensure TypeScript types work correctly

## Package Publishing Workflow

1. **Development**: Make changes in `src/`
2. **Testing**: Run `npm test` to verify functionality
3. **Building**: Run `npm run build` to compile to `dist/`
4. **Packaging**: Run `npm pack` to test package contents
5. **Publishing**: Run `npm publish` to release

## Important Notes for AI

- **Always test changes**: The test suite is comprehensive and catches edge cases
- **Maintain backward compatibility**: This is a storage library used by other projects
- **Follow TypeScript best practices**: Use strict typing and proper error handling
- **File system safety**: Always handle file operations with proper error handling
- **Concurrency awareness**: Consider file locking when modifying storage operations
- **Documentation**: Update README.md for any API changes
- **Type safety**: Ensure all new features have proper TypeScript types

## Dependencies

**Production**: 
- `@bartek01001/async-tasks-queue`: For connection management and file locking

**Development**: 
- TypeScript, Jest, ts-jest, type definitions

The package is designed to be lightweight with minimal production dependencies while providing robust file-based storage capabilities.