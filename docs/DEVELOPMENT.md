# Development Guide

## Project Overview

This is a **backend Node.js package** written in **TypeScript** that provides CRUD operations for JSON file storage with MongoDB-like filtering capabilities.

## Project Structure

```
json-storage/
├── data/                    # Storage directory for JSON files
├── docs/                    # Project documentation
├── src/                     # Source code
│   ├── JSONStorage.ts       # Main storage class
│   └── JSONStorage.types.ts # TypeScript type definitions
├── tests/                   # Test files
│   ├── JSONStorge.test.ts   # CRUD operations tests
│   └── JSONStorage.filter.test.ts # Filtering functionality tests
├── index.ts                 # Main entry point
├── package.json             # NPM package configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.build.json     # Build-specific TypeScript config
└── vitest.config.ts        # Vitest testing configuration
```

## Prerequisites

- **Node.js** (version 18 or higher)
- **NPM** (comes with Node.js)
- **TypeScript** (installed as dev dependency)

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Run tests in watch mode**:
   ```bash
   npm run dev
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## Technology Stack

- **Language**: TypeScript (ES2024 target)
- **Module System**: ESM (ES Modules)
- **Testing Framework**: Vitest
- **Build Tool**: TypeScript Compiler
- **Package Manager**: NPM

## Configuration Files

### TypeScript Configuration

- **tsconfig.json**: Main TypeScript configuration with path mapping and strict settings
- **tsconfig.build.json**: Build-specific config that excludes tests

### Testing Configuration

- **vitest.config.ts**: Vitest configuration with Node.js environment and single-threaded execution

### Package Configuration

- **package.json**: NPM package with ESM module type, build scripts, and dependencies

## Development Workflow

### Code Structure

The main class `JSONStorage` provides:
- **Connection management** with directory validation
- **CRUD operations** (create, read, update, delete)
- **Advanced filtering** with MongoDB-like syntax
- **Concurrent access protection** using file locks

### Testing Strategy

- **Unit tests** for all CRUD operations
- **Integration tests** for filtering functionality
- **Concurrent access tests** to ensure thread safety
- **Test isolation** with separate directories for each test suite

### Build Process

1. **TypeScript compilation** with declaration files
2. **Source maps** generation for debugging
3. **Path mapping** for clean imports
4. **ESM module** output

### Publishing Process

1. **Build** the project (`npm run build`)
2. **Run tests** to ensure quality (`npm test`)
3. **Publish** to NPM (`npm publish`)

## Key Features

- **File-based storage** with JSON documents
- **MongoDB-like filtering** with operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex, $and, $or, $not)
- **Concurrent access protection** using lock directories
- **TypeScript support** with full type definitions
- **ESM module** for modern Node.js applications

## Dependencies

- **@bartek01001/async-tasks-queue**: For managing concurrent operations
- **@types/node**: TypeScript definitions for Node.js
- **typescript**: TypeScript compiler
- **vitest**: Testing framework

## Development Commands

- `npm test` - Run all tests
- `npm run dev` - Run tests in watch mode
- `npm run build` - Build the project
- `npm run prepublishOnly` - Build before publishing

