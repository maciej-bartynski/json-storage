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
- **ESM Support**: Modern ES modules support for Node.js

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
├── dist/                      # Transpiled JavaScript + type definitions. No code work here! This dir can be missing.
├── index.ts                   # Main export file
├── package.json               # NPM package configuration
├── tsconfig.json              # TypeScript config (development + tests)
├── tsconfig.build.json        # TypeScript config (production build)
├── vitest.config.ts           # Vitest test configuration
└── README.md                  # User documentation
```

## Build and Import System

### Import Mapping Flow

The project uses a sophisticated import mapping system that works across different environments:

**1. Package.json Import Maps** (for npm package consumers):
```json
"imports": {
  "#src/*.js": "./dist/src/*.js",
  "#src/**/*.js": "./dist/src/**/*.js"
}
```
- Maps `#src/` aliases to compiled JavaScript files in `dist/src/`
- Used when the package is consumed by other projects

**2. TypeScript Configuration** (for development):
```json
"paths": {
  "#src/*": ["src/*"],
  "tests/*": ["tests/*"]
}
```
- Maps `#src/` to source TypeScript files in `src/`
- Used during development and compilation
- Tests are included in `tsconfig.json` but not emitted

**3. Vitest Configuration** (for testing):
```json
"resolve": {
  "alias": {
    "#src": "path.resolve(__dirname, 'dist/src')"
  }
}
```
- Maps `#src/` to compiled JavaScript in `dist/src/`
- Tests run against compiled code, not source TypeScript

### Build Process

1. **Development**: TypeScript compiles `src/` → `dist/src/`
2. **Testing**: Vitest runs tests against compiled `dist/src/` files
3. **Publishing**: Only `dist/` and `README.md` are included in npm package
4. **Consumption**: Other projects use `#src/` aliases mapped to `dist/src/`

### Why This Architecture?

- **Type Safety**: Development uses TypeScript source files
- **Testing Reality**: Tests run against actual compiled output
- **Package Integrity**: Consumers get only compiled, tested code
- **Import Consistency**: Same `#src/` alias works everywhere

## Configuration Files

### TypeScript Configuration

**tsconfig.json** (Development + Tests):
- Includes both `src/` and `tests/` directories
- Enables path aliases: `#src/*` → `src/*`, `tests/*` → `tests/*`
- Generates source maps and declaration maps
- Strict type checking enabled
- ESM module system with NodeNext

**tsconfig.build.json** (Production Build):
- Excludes `tests/` directory
- Only compiles source code for npm package
- Used by `npm run build` command

### Vitest Configuration

**vitest.config.ts**:
- Uses Vitest for modern testing
- Maps path aliases for tests: `#src` → `dist/src`
- Node.js test environment
- Runs tests sequentially with single thread to avoid file system conflicts
- Tests compiled JavaScript from `dist/` directory

## Available Commands

### Development Commands
```bash
npm run dev          # Run tests in watch mode with Vitest
npm test             # Run tests once with Vitest
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
4. **Testing**: Always run `npm test` after changes (tests compiled JS from dist/)
5. **Building**: Use `npm run build` to compile changes before testing

**When adding new features:**
1. **Implementation**: Add to `src/JSONStorage.ts`
2. **Types**: Update `src/JSONStorage.types.ts` if new types are needed
3. **Tests**: Add corresponding tests in appropriate test files:
   - CRUD operations → `tests/JSONStorge.test.ts`
   - Filtering features → `tests/JSONStorage.filter.test.ts`
4. **Documentation**: Update `README.md` if API changes
5. **Build & Test**: Run `npm run build` then `npm test`

**When fixing bugs:**
1. **Reproduce**: Create test case in appropriate test file
2. **Fix**: Modify `src/JSONStorage.ts` or `src/JSONStorage.types.ts`
3. **Build**: Run `npm run build` to compile changes
4. **Verify**: Run `npm test` to ensure all tests pass (tests compiled JS)

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
- `#src/JSONStorage` → `dist/src/JSONStorage.js` (compiled)
- `#src/JSONStorage.types` → `dist/src/JSONStorage.types.js` (compiled)
- `tests/*` → `tests/*`
- Configured in both TypeScript and Vitest

**Test Strategy:**
- **Testing compiled code**: Tests run against compiled JavaScript in `dist/`
- **CRUD tests**: Verify create, read, update, delete operations
- **Concurrency tests**: Test file locking and concurrent access
- **Filter tests**: Comprehensive testing of all filter operators
- **Error handling**: Test various error scenarios
- **Type safety**: Ensure TypeScript types work correctly

## Package Publishing Workflow

1. **Development**: Make changes in `src/`
2. **Building**: Run `npm run build` to compile to `dist/`
3. **Testing**: Run `npm test` to verify functionality (tests compiled JS)
4. **Packaging**: Run `npm pack` to test package contents
5. **Publishing**: Run `npm publish` to release

## Important Notes for AI

- **Always build before testing**: Tests run against compiled JavaScript from `dist/`
- **Maintain backward compatibility**: This is a storage library used by other projects
- **Follow TypeScript best practices**: Use strict typing and proper error handling
- **File system safety**: Always handle file operations with proper error handling
- **Concurrency awareness**: Consider file locking when modifying storage operations
- **Documentation**: Update README.md for any API changes
- **Type safety**: Ensure all new features have proper TypeScript types
- **ESM only**: Package supports only ES modules, no CommonJS

## Dependencies

**Production**: 
- `@bartek01001/async-tasks-queue`: For connection management and file locking

**Development**: 
- TypeScript, Vitest, type definitions

The package is designed to be lightweight with minimal production dependencies while providing robust file-based storage capabilities with modern ESM support.