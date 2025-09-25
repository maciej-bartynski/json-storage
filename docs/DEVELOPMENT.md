# Development Guide

Complete technical guide for developing, maintaining, and deploying the JSON Storage package.

## Prerequisites

- Node.js 18+ (ES2024 support required)
- npm 9+

## Local Development Setup

Install dependencies:
```bash
npm install
```

## Project Structure

```
json-storage/
├── src/                    # Source code
│   ├── JSONStorage.ts     # Main storage class
│   └── JSONStorage.types.ts # Type definitions
├── tests/                  # Test files
│   ├── JSONStorage.test.ts # Core functionality tests
│   ├── JSONStorage.filter.test.ts # Filtering tests
│   └── JSONStorage.maxFileAmount.test.ts # File limit management tests
├── dist/                   # Build output (generated)
├── index.ts               # Main entry point
├── tsconfig.json          # TypeScript configuration
├── tsconfig.build.json    # Build-specific TypeScript config
└── vitest.config.ts       # Test configuration
```

## Development Workflow

### Available Scripts

- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run test`** - Run all tests once
- **`npm run dev`** - Start Vitest in watch mode for development
- **`npm run prepublishOnly`** - Build before publishing (automatic)

### Development Process

**Critical**: Tests run against **built code** in `dist/` folder, not source code.

**Standard Workflow:**
```bash
# 1. Build the project
npm run build

# 2. Run tests against built code
npm run test

# 3. For development with auto-rebuild:
npm run dev
```

**Development Mode (`npm run dev`):**
- Starts Vitest in watch mode
- Automatically re-runs tests when files change
- **Requires `dist/` folder to exist** - always build first
- **Does NOT auto-rebuild** - you must manually rebuild after source changes

### Testing

```bash
npm run test
```

**IMPORTANT**: Tests run against **built code** in `dist/` folder, not source code.

**Test Configuration:**
- **Framework**: Vitest 3.2.4
- **Environment**: Node.js
- **Execution**: Single-threaded, sequential (no concurrency)
- **Timeout**: 10 seconds per test
- **Test Target**: Compiled JavaScript in `dist/src/` (via `#src` alias)

**Test Files:**
- **`JSONStorage.test.ts`**: Core CRUD operations and connection tests
- **`JSONStorage.filter.test.ts`**: Advanced filtering and query operations
- **`JSONStorage.maxFileAmount.test.ts`**: File limit management and statistics functionality
- **Coverage**: Tests verify the actual compiled output that users will consume

**Why Test Built Code?**
- Ensures TypeScript compilation produces working JavaScript
- Tests the exact code that will be published to NPM
- Catches build-time errors during development

### Building

```bash
npm run build
```

**Build Process:**
1. TypeScript compilation using `tsconfig.build.json`
2. Output directory: `dist/`
3. Generates: JavaScript files, type definitions, source maps
4. Excludes test files from build

**Build Configuration:**
- **Target**: ES2024
- **Module**: NodeNext
- **Output**: `dist/` directory
- **Declaration files**: Enabled
- **Source maps**: Enabled

## TypeScript Configuration

### Main Config (`tsconfig.json`)
- Includes source and test files
- Path mapping for `#src/*` aliases
- Vitest globals enabled

### Build Config (`tsconfig.build.json`)
- Extends main config
- Excludes test files
- Used for production builds

## Code Architecture

### Core Components

**JSONStorage Class**
- Main storage service with CRUD operations
- Automatic directory creation and permission handling
- Connection queue for concurrent access control

**File Operations**
- Atomic file operations with lock directories
- UUID generation for document IDs
- Error handling for filesystem operations

**Filtering System**
- MongoDB-like query operators
- Support for comparison, array, string, and logical operators
- Sorting and pagination capabilities

### Concurrency Control

- **AsyncTasksQueue**: Prevents concurrent initialization
- **Lock Directories**: File-level locking for CRUD operations
- **Single-threaded Tests**: Ensures deterministic test execution

## Publishing

### Pre-publish Process

```bash
npm run prepublishOnly
```

Automatically runs build before publishing to ensure latest code is compiled.

### Package Configuration

- **Main Entry**: `dist/index.js`
- **Type Definitions**: `dist/index.d.ts`
- **Files Included**: `dist/` directory and `README.md`
- **Access**: Public NPM package

### Version Management

- Update version in `package.json`
- Run `npm publish` to release
- Package automatically builds before publishing

## Environment and Dependencies

### Production Dependencies
- `@bartek01001/async-tasks-queue` - Concurrency control

### Development Dependencies
- `@bartek01001/fadro` - Development framework
- `@types/node` - Node.js type definitions
- `typescript` - TypeScript compiler
- `vitest` - Testing framework

### Common Development Issues

**Tests Fail with Import Errors**
- **Cause**: `dist/` folder missing or outdated
- **Solution**: Run `npm run build` before `npm run test`

**Vitest Cannot Resolve #src Aliases**
- **Cause**: Build output missing
- **Solution**: Ensure `dist/src/` contains compiled JavaScript files

**TypeScript Errors in Tests**
- **Cause**: Tests import from `#src/*.js` (built code), not source
- **Solution**: Build project to generate `dist/` folder
